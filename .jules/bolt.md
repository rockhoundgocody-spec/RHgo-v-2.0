# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-03-30 - Declarative flatMap extraction and Base44 SDK field projections in edge functions

**Learning:** Replacing imperative nested `for` loops with `flatMap` and `Set` in array transformations simplifies data pipelines and improves code declarative readability. Combining this with Base44 SDK field projections (`.list(sort, limit, skip, fields)`) drastically reduces JSON payload sizes and memory serialization overhead over the network for entity queries.

**Action:** Look for nested entity property extraction loops and unprojected entity `.list()` calls in edge functions and replace them with `flatMap` + `Set` and explicit field selection arrays.
