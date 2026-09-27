# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-03-29 - Parallelizing Bulk Creation Across Chunks with Promise.all

**Learning:** In edge functions where bulk insertions are chunked into fixed-size batches (e.g. 25 items per chunk), awaiting `bulkCreate` sequentially in a `for` loop introduces an unnecessary network waterfall where each batch must wait for the preceding HTTP response. Executing all chunk `bulkCreate` promises concurrently using `Promise.all(chunks.map(chunk => entity.bulkCreate(chunk)))` reduces total execution latency from `O(N_chunks * latency)` to `O(latency)`.

**Action:** Whenever chunking records for `bulkCreate` in Base44 edge functions, collect chunks into an array and execute them via `Promise.all` rather than sequential `await` inside a `for` loop.
