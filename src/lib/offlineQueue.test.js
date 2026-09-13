import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
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
} from "./offlineQueue";
import { base44 } from "@/api/base44Client";

vi.mock("@/api/base44Client", () => ({
  base44: {
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
    const offlineItem = { entity: "Specimen", op: "create", data: { mineral_name: "Quartz" } };

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

    // Ensure it re-saved as encrypted JSON
    const rawStored = localStorage.getItem("rh-offline-queue-v1");
    expect(rawStored.includes("Agate")).toBe(false);
    const parsedStored = JSON.parse(rawStored);
    expect(parsedStored.version).toBe(1);
  });

  it("handles corrupted storage data gracefully", async () => {
    localStorage.setItem("rh-offline-queue-v1", "corrupted-non-json-string");
    const items = await loadQueue();
    expect(items).toEqual([]);
    expect(getQueueLength()).toBe(0);
  });

  it("returns an empty queue when storage has no queue payload", async () => {
    localStorage.removeItem("rh-offline-queue-v1");
    await expect(loadQueue()).resolves.toEqual([]);
    expect(getQueueLength()).toBe(0);
  });

  it("preserves every previously saved write and rejects when storage is full", async () => {
    const original = [{ entity: 'Specimen', op: 'create', data: { mineral_name: 'Agate' } }];
    await saveQueue(original);
    const storedBefore = localStorage.getItem('rh-offline-queue-v1');
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key === 'rh-offline-queue-v1') throw new Error('Storage quota exceeded');
      originalSetItem.call(localStorage, key, value);
    };
    try {
      const incoming = [...original, { entity: 'Specimen', op: 'create', data: { mineral_name: 'Quartz' } }];
      await expect(saveQueue(incoming)).rejects.toThrow('Storage quota exceeded');
      expect(localStorage.getItem('rh-offline-queue-v1')).toBe(storedBefore);
      expect(getQueueLength()).toBe(1);
      expect(await loadQueue()).toEqual(original);
      await expect(saveQueue([])).rejects.toThrow('Storage quota exceeded');
      expect(localStorage.getItem('rh-offline-queue-v1')).toBe(storedBefore);
    } finally {
      localStorage.setItem = originalSetItem;
    }
  });

  it("flushes queue when network returns", async () => {
    base44.entities.Specimen.create.mockResolvedValueOnce({ id: "spec-123" });

    await saveQueue([{ entity: "Specimen", op: "create", data: { mineral_name: "Fluorite" } }]);
    expect(getQueueLength()).toBe(1);

    const flushResult = await flushQueue();
    expect(flushResult.flushed).toBe(1);
    expect(flushResult.remaining).toBe(0);
    expect(getQueueLength()).toBe(0);
    expect(base44.entities.Specimen.create).toHaveBeenCalledWith({ mineral_name: "Fluorite" });
  });
});