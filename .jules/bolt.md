# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-09-27 - Parallelizing sequential database updates in event handlers

**Learning:** When superseding or updating multiple prior records in event processors or sync handlers (e.g. `ID_RESULT_APPEND` in `applyEvents.ts`), executing sequential `for (const r of prior) { await update(...) }` loops introduces linear latency bottlenecks `O(N * DB_latency)`. Wrapping independent entity updates with `Promise.all(prior.map(...))` allows database queries to execute concurrently, reducing latency from `N * DB_latency` to `~1 * DB_latency`.

**Action:** Whenever iterating through a collection of independent entities to call `entity.update(id, patch)`, use `Promise.all(collection.map(...))` to execute the updates concurrently.
