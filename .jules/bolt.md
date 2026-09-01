## 2025-09-01 - Bulk Cache Keys Lookup in Offline Tile Prefetching

**Learning:** Invoking `cache.match(url)` iteratively in a loop for hundreds of tile URLs introduces an N+1 Cache API lookup bottleneck due to repeated IPC/IndexedDB queries. Retrieving all cached request URLs upfront using a single `cache.keys()` call and storing them in a `Set` turns per-tile cache validation into O(1) in-memory checks.

**Action:** When validating if large sets of resources (e.g., map tiles or static assets) exist in Cache Storage, use `await cache.keys()` once to construct an in-memory `Set` of cached URLs before performing batch operations.
