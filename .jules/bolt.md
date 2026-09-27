# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-03-29 - Batch loading specimens and shared hotspots in weeklyFieldMissions

**Learning:** Invoking `Specimen.filter` and `Hotspot.list` inside a per-user loop causes an N+1 query waterfall (1 + 2N queries for N users). Batching user IDs into chunks of 100 with `{ created_by_id: { $in: batchUserIds } }`, selecting explicit field projections (`['id', 'created_by_id', 'created_date', 'mineral_name', 'lat', 'lng']`), and pulling global hotspot queries outside the loop reduced database queries by 99.3% (from 1001 down to 7 queries for 500 users).

**Action:** In scheduled or batch edge functions processing collections of users, always fetch global reference data (such as hotspots or configuration) once before the loop, and batch query user-specific child entities using `$in` chunking with explicit field projection.
