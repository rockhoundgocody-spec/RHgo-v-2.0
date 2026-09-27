# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-03-31 - Declarative flatMap vs Imperative Nested Loops for Small Sets
**Learning:** For small arrays (e.g. `nearby` hotspots slice of length <= 8), replacing nested loops with `new Set(array.flatMap(item => item.subArray || []))` produces significantly cleaner and more declarative code with equivalent performance safety.
**Action:** Use `flatMap` with fallback empty arrays (`|| []`) for flattening nested object properties into Set instances.
