# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-09-27 - Parallelizing sequential DB updates in sync event handlers

**Learning:** When updating multiple records sequentially in async handlers (e.g., `for (const r of prior) { await ctx.entities.SyncIdResult.update(...) }`), each operation incurs round-trip network/DB latency sequentially (N * Latency). Using `Promise.all(prior.map(...))` allows I/O requests to run concurrently, reducing total execution time from O(N * Latency) to O(Latency).

**Action:** Whenever iterating over a list of items to perform independent database updates or async side-effects, prefer `Promise.all()` to execute operations concurrently.
