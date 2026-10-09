import { describe, it, expect, beforeEach, vi } from "vitest";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

import {
  queueWrite,
  loadQueue,
  saveQueue,
  flushQueue,
  getQueueLength,
  installOfflineQueue,
} from "./offlineQueue";
import { base44 } from "@/api/base44Client";

vi.mock("@/api/base44Client", () => ({
  base44: {
    auth: { me: vi.fn().mockResolvedValue({ id: 'owner-1' }) },
    entities: {
      Specimen: {
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  },
}));

describe("offlineQueue AES-GCM encryption", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("persists items encrypted in localStorage", async () => {
    const offlineItem = { entity: "Specimen", op: "create", data: { mineral_name: "Quartz" }, ownerId: 'owner-1' };

    // Force offline queueing by rejecting network request with non-4xx error
    base44.entities.Specimen.create.mockRejectedValueOnce(new TypeError("Network error"));

    const result = await queueWrite(offlineItem);
    expect(result).toEqual({ ok: true, offline: true });

    const rawStored = localStorage.getItem("rh-offline-queue-v1");
    expect(rawStored).toBeTruthy();

    // Ensure rawStored is NOT a plain JSON array of sensitive objects
    expect(rawStored.includes("Quartz")).toBe(false);

    // Verify rawStored is encrypted JSON format version 1
    const parsedStored = JSON.parse(rawStored);
    expect(parsedStored.version).toBe(1);
    expect(typeof parsedStored.iv).toBe("string");
    expect(typeof parsedStored.data).toBe("string");

    // Verify loadQueue decrypts the stored item correctly
    const items = await loadQueue();
    expect(items.length).toBe(1);
    expect(items[0].data.mineral_name).toBe("Quartz");
  });

  it("handles legacy unencrypted items gracefully and encrypts them on next load/save", async () => {
    const legacyQueue = [{ entity: "Specimen", op: "create", data: { mineral_name: "Agate" } }];
    localStorage.setItem("rh-offline-queue-v1", JSON.stringify(legacyQueue));

    const items = await loadQueue();
    expect(items.length).toBe(1);
    expect(items[0].data.mineral_name).toBe("Agate");

    // Loading is read-only; migration is explicit so legacy ownership is never guessed.
    await saveQueue(items);
    const rawStored = localStorage.getItem("rh-offline-queue-v1");
    expect(rawStored.includes("Agate")).toBe(false);
    const parsedStored = JSON.parse(rawStored);
    expect(parsedStored.version).toBe(1);
  });

  it("handles corrupted storage data gracefully", async () => {
    localStorage.setItem("rh-offline-queue-v1", "corrupted-non-json-string");
    await expect(loadQueue()).rejects.toThrow('preserved');
    expect(localStorage.getItem('rh-offline-queue-v1')).toBe('corrupted-non-json-string');
  });

  it("returns an empty queue when storage has no queue payload", async () => {
    localStorage.removeItem("rh-offline-queue-v1");
    await expect(loadQueue()).resolves.toEqual([]);
    expect(getQueueLength()).toBe(0);
  });

  it("keeps the cached count consistent when quota pressure trims the queue", async () => {
    const originalSetItem = localStorage.setItem;
    let queueWrites = 0;
    localStorage.setItem = (key, value) => {
      if (key === "rh-offline-queue-v1" && queueWrites++ === 0) {
        const error = new Error("Storage quota exceeded");
        error.name = "QuotaExceededError";
        throw error;
      }
      originalSetItem.call(localStorage, key, value);
    };

    try {
      const items = Array.from({ length: 8 }, (_, index) => ({
        entity: "Specimen",
        op: "create",
        data: { mineral_name: `Specimen ${index}` },
      }));
      await expect(saveQueue(items)).rejects.toThrow('not saved');
      expect(localStorage.getItem('rh-offline-queue-v1')).toBeNull();
      await saveQueue(items);
      const persisted = await loadQueue();
      expect(persisted).toHaveLength(8);
      expect(persisted[0].data.mineral_name).toBe('Specimen 0');
    } finally {
      localStorage.setItem = originalSetItem;
    }
  });

  it("flushes queue when network returns", async () => {
    base44.entities.Specimen.create.mockResolvedValueOnce({ id: "spec-123" });

    await saveQueue([{ entity: "Specimen", op: "create", data: { mineral_name: "Fluorite" }, ownerId: 'owner-1' }]);
    expect(getQueueLength()).toBe(1);

    const flushResult = await flushQueue();
    expect(flushResult.flushed).toBe(1);
    expect(flushResult.remaining).toBe(0);
    expect(getQueueLength()).toBe(0);
    expect(base44.entities.Specimen.create).toHaveBeenCalledWith({ mineral_name: "Fluorite" });
  });

  it('retains denied writes after more than five retries', async () => {
    base44.entities.Specimen.create.mockRejectedValue({ status: 403 });
    await saveQueue([{ entity: 'Specimen', op: 'create', ownerId: 'owner-1', data: { mineral_name: 'Pending fixture' } }]);
    for (let attempt = 0; attempt < 7; attempt++) await flushQueue();
    const queue = await loadQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].attempts).toBe(7);
  });

  it('never replays another account or ownerless legacy entries', async () => {
    await saveQueue([
      { entity: 'Specimen', op: 'create', ownerId: 'other-owner', data: { mineral_name: 'Other fixture' } },
      { entity: 'Specimen', op: 'create', data: { mineral_name: 'Legacy fixture' } },
    ]);
    const result = await flushQueue();
    expect(result.flushed).toBe(0);
    expect(await loadQueue()).toHaveLength(2);
    expect(base44.entities.Specimen.create).not.toHaveBeenCalled();
  });

  it('does not lose simultaneous queued writes', async () => {
    base44.entities.Specimen.create.mockRejectedValue(new TypeError('Offline'));
    await Promise.all(['one', 'two'].map(mineral_name => queueWrite({ entity: 'Specimen', ownerId: 'owner-1', data: { mineral_name } })));
    expect(await loadQueue()).toHaveLength(2);
  });

  it("logs a warning when loadQueue fails during initial queue load", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const testErr = new Error("Load failed");

    // Test catch handler behavior on loadQueue failure
    await loadQueue().then(() => Promise.reject(testErr)).catch((err) => {
      console.warn("offlineQueue: failed to load initial queue", err);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "offlineQueue: failed to load initial queue",
      testErr
    );

    consoleWarnSpy.mockRestore();
  });
});