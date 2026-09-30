import { describe, it, expect, beforeEach, vi } from "vitest";

describe("offlineCache", () => {
  let mockStores;

  function createMockIndexedDB(options = {}) {
    mockStores = new Map();

    return {
      open: vi.fn(() => {
        const db = {
          objectStoreNames: {
            contains: (name) => mockStores.has(name),
          },
          createObjectStore: (name) => {
            mockStores.set(name, new Map());
          },
          transaction: vi.fn((storeName) => {
            const storeMap = mockStores.get(storeName) || new Map();
            const tx = {
              error: options.txError || new Error("Transaction failed"),
              oncomplete: null,
              onerror: null,
              objectStore: vi.fn(() => ({
                put: vi.fn((item) => {
                  if (options.putError) {
                    setTimeout(() => {
                      if (tx.onerror) tx.onerror();
                    }, 0);
                    return;
                  }
                  storeMap.set(item.key, item);
                  setTimeout(() => {
                    if (tx.oncomplete) tx.oncomplete();
                  }, 0);
                }),
                get: vi.fn((key) => {
                  const req = {
                    result: storeMap.get(key),
                    error: options.getError || new Error("Get failed"),
                    onsuccess: null,
                    onerror: null,
                  };
                  setTimeout(() => {
                    if (options.getError) {
                      if (req.onerror) req.onerror();
                    } else {
                      if (req.onsuccess) req.onsuccess();
                    }
                  }, 0);
                  return req;
                }),
              })),
            };
            return tx;
          }),
        };

        const openReq = {
          result: db,
          error: options.openError || new Error("Open failed"),
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };

        setTimeout(() => {
          if (options.openError) {
            if (openReq.onerror) openReq.onerror();
          } else {
            if (openReq.onupgradeneeded) openReq.onupgradeneeded();
            if (openReq.onsuccess) openReq.onsuccess();
          }
        }, 0);

        return openReq;
      }),
    };
  }

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("saves and loads data successfully from cache", async () => {
    globalThis.indexedDB = createMockIndexedDB();
    const { saveCache, loadCache } = await import("./offlineCache.js");

    const testData = [{ id: 1, name: "Gold Prospect" }, { id: 2, name: "Quartz Quarry" }];
    await saveCache("Hotspots", testData);

    const cached = await loadCache("Hotspots");
    expect(cached).not.toBeNull();
    expect(cached.key).toBe("Hotspots");
    expect(cached.data).toEqual(testData);
    expect(typeof cached.updatedAt).toBe("number");
  });

  it("returns null when key is not found in cache", async () => {
    globalThis.indexedDB = createMockIndexedDB();
    const { loadCache } = await import("./offlineCache.js");

    const cached = await loadCache("NonExistentKey");
    expect(cached).toBeNull();
  });

  it("overwrites existing data when saveCache is called again for same key", async () => {
    globalThis.indexedDB = createMockIndexedDB();
    const { saveCache, loadCache } = await import("./offlineCache.js");

    await saveCache("Hotspots", [{ id: 1, name: "Initial" }]);
    await saveCache("Hotspots", [{ id: 1, name: "Updated" }]);

    const cached = await loadCache("Hotspots");
    expect(cached.data).toEqual([{ id: 1, name: "Updated" }]);
  });

  it("handles saveCache and loadCache gracefully when indexedDB is undefined", async () => {
    delete globalThis.indexedDB;
    const { saveCache, loadCache } = await import("./offlineCache.js");

    await expect(saveCache("Hotspots", [{ id: 1 }])).resolves.not.toThrow();
    const cached = await loadCache("Hotspots");
    expect(cached).toBeNull();
  });

  it("handles indexedDB.open error gracefully", async () => {
    globalThis.indexedDB = createMockIndexedDB({ openError: new Error("Quota or permission error") });
    const { saveCache, loadCache } = await import("./offlineCache.js");

    await expect(saveCache("Hotspots", [{ id: 1 }])).resolves.not.toThrow();
    const cached = await loadCache("Hotspots");
    expect(cached).toBeNull();
  });

  it("handles transaction put error in saveCache gracefully", async () => {
    globalThis.indexedDB = createMockIndexedDB({ putError: true });
    const { saveCache } = await import("./offlineCache.js");

    await expect(saveCache("Hotspots", [{ id: 1 }])).resolves.not.toThrow();
  });

  it("handles get error in loadCache gracefully", async () => {
    globalThis.indexedDB = createMockIndexedDB({ getError: new Error("Read error") });
    const { saveCache, loadCache } = await import("./offlineCache.js");

    await saveCache("Hotspots", [{ id: 1 }]);
    const cached = await loadCache("Hotspots");
    expect(cached).toBeNull();
  });
});
