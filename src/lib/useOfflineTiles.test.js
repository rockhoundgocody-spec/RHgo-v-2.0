import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState, useCallback } from "react";
import useOfflineTiles from "./useOfflineTiles.js";

// Mock React hooks or we can test the function by invoking it
// Let us mock React hooks or test useOfflineTiles directly since we are running in unit tests
// We can mock React.useState and React.useCallback to capture the callback returned

vi.mock("react", () => {
  return {
    useState: (initial) => {
      let val = initial;
      const setter = (newVal) => {
        val = newVal;
      };
      return [val, setter];
    },
    useCallback: (fn) => fn,
  };
});

describe("useOfflineTiles", () => {
  let mockCache;
  let mockCaches;
  let mockFetch;

  beforeEach(() => {
    mockCache = {
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };

    mockCaches = {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn().mockResolvedValue(true),
    };

    mockFetch = vi.fn().mockResolvedValue({ ok: true });

    global.window = {
      caches: mockCaches,
    };
    global.caches = mockCaches;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    delete global.window;
    delete global.caches;
    delete global.fetch;
    vi.restoreAllMocks();
  });

  it("should prefetch tiles with cors mode and cache them", async () => {
    const { prefetch } = useOfflineTiles();

    // Call prefetch with narrow zoom level so it is fast
    await prefetch({ lat: 45, lng: -85, radiusMiles: 1, minZoom: 7, maxZoom: 7 });

    expect(mockCaches.open).toHaveBeenCalledWith("rh-tiles-v1");
    expect(mockFetch).toHaveBeenCalled();
    const fetchCalls = mockFetch.mock.calls;
    expect(fetchCalls.length).toBeGreaterThan(0);

    // Check that every fetch call used mode: "cors"
    fetchCalls.forEach(call => {
      expect(call[1]).toEqual({ mode: "cors" });
    });
  });
});
