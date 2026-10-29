# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-03-29 - Parallelizing Bulk Creation Across Chunks with Promise.all

**Learning:** In edge functions where bulk insertions are chunked into fixed-size batches (e.g. 25 items per chunk), awaiting `bulkCreate` sequentially in a `for` loop introduces an unnecessary network waterfall where each batch must wait for the preceding HTTP response. Executing all chunk `bulkCreate` promises concurrently using `Promise.all(chunks.map(chunk => entity.bulkCreate(chunk)))` reduces total execution latency from `O(N_chunks * latency)` to `O(latency)`.

**Action:** Whenever chunking records for `bulkCreate` in Base44 edge functions, collect chunks into an array and execute them via `Promise.all` rather than sequential `await` inside a `for` loop.
## 2026-09-29 - Single-Pass Direct Set Filtering vs flatMap Array Allocations

**Learning:** Using `[...new Set(array.flatMap(fn))].filter(predicate)` creates intermediate array allocations for each sub-array, invokes closure callbacks for every element, and performs double iteration (once for flattening and once for flattening). Replacing `flatMap` with a single-pass loop that filters directly before `Set.add()` eliminates intermediate array allocations and closure overhead, yielding ~1.97x speedup (~49% time reduction).

**Action:** Avoid `flatMap` followed by `Set` deduplication and `.filter()` when building unique lists from nested arrays; filter directly during Set population in a single pass.

## 2026-10-29 - Early-Exit Linear Checks vs Full Ranking and Sorting

**Learning:** Calling heavy list mapping, gap counting, and O(N log N) sorting functions (like `rankHotspots`) to compute simple boolean conditions (like `hasNearbyHotspots` checking `.some(dist <= 75)`) forces full array allocation and sorting on every render or location update. Replacing `rankHotspots(...).some(...)` with a linear `for` loop that calculates distance and exits immediately on the first match yields a >1500x speedup (3.38s vs 2.17ms for 10k passes).

**Action:** Avoid executing heavy array transformation, multi-field scoring, or sorting pipelines when only checking a boolean existence condition or threshold. Use early-exiting linear loops instead.
