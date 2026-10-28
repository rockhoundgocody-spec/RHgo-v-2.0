# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-03-29 - Parallelizing Bulk Creation Across Chunks with Promise.all

**Learning:** In edge functions where bulk insertions are chunked into fixed-size batches (e.g. 25 items per chunk), awaiting `bulkCreate` sequentially in a `for` loop introduces an unnecessary network waterfall where each batch must wait for the preceding HTTP response. Executing all chunk `bulkCreate` promises concurrently using `Promise.all(chunks.map(chunk => entity.bulkCreate(chunk)))` reduces total execution latency from `O(N_chunks * latency)` to `O(latency)`.

**Action:** Whenever chunking records for `bulkCreate` in Base44 edge functions, collect chunks into an array and execute them via `Promise.all` rather than sequential `await` inside a `for` loop.
## 2026-09-29 - Single-Pass Direct Set Filtering vs flatMap Array Allocations

**Learning:** Using `[...new Set(array.flatMap(fn))].filter(predicate)` creates intermediate array allocations for each sub-array, invokes closure callbacks for every element, and performs double iteration (once for flattening and once for filtering). Replacing `flatMap` with a single-pass loop that filters directly before `Set.add()` eliminates intermediate array allocations and closure overhead, yielding ~1.97x speedup (~49% time reduction).

**Action:** Avoid `flatMap` followed by `Set` deduplication and `.filter()` when building unique lists from nested arrays; filter directly during Set population in a single pass.

## 2026-10-14 - Hoisting Global Entity Queries and Batching Bulk Creation in Multi-Tenant Loops

**Learning:** In scheduled batch edge functions iterating over users (e.g. `weeklyFieldMissions`), fetching static entities like `Hotspot.list` inside the user loop creates N-1 redundant HTTP queries (e.g. 499 redundant calls for 500 users). Hoisting static entity queries outside the loop and fetching them concurrently alongside initial user listing via `Promise.all` completely eliminates redundant network calls. Combining this with `bulkCreate` for entity generation cuts total network round-trips per user batch dramatically.

**Action:** Hoist static entity reads outside per-user loops in batch functions and combine entity creation calls into single `bulkCreate` payload requests.
