# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2025-05-19 - Replacing N+1 sequential entity creation loop with bulkCreate in scheduled edge functions

**Learning:** In scheduled edge functions processing large batches of records (such as `weeklyFieldMissions` generating quests across hundreds of users), sequentially awaiting `await entity.create(...)` inside a `for (const item of items)` loop creates severe N+1 database round-trip overhead (e.g. 1,500 round trips for 500 users × 3 missions). Mapping items to an array of objects and passing them to `await entity.bulkCreate(recordsArray)` reduces network round trips from N to 1 per user.

**Action:** Whenever generating multiple entity records inside per-user processing loops in edge functions, construct the record array in memory and invoke `bulkCreate` to execute a single batch insert per user.