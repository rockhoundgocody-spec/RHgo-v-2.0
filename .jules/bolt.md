# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-03-30 - Parallelizing Chunked bulkCreate Requests in Edge Functions

**Learning:** When ingesting or processing large record batches in Base44 edge functions, chunking items into fixed-size batches (e.g. 25 items) and awaiting `bulkCreate` sequentially in a `for` loop introduces sequential network round-trip latency. Executing `bulkCreate` calls across chunks concurrently via `Promise.all` / `Promise.allSettled` (`bulkCreateInParallel`) reduces total insertion latency from O(N_chunks * T_latency) to O(1 * T_latency), achieving a ~4x speedup for 100 items (4 chunks).

**Action:** Replace sequential `for` loops iterating over chunks of `bulkCreate` with `Promise.all` / `Promise.allSettled` to run chunk creations concurrently.
