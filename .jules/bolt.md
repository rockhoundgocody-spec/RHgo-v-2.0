# Bolt's Journal

## 2025-05-18 - Replacing N+1 Promise.all entity creation with bulkCreate

**Learning:** When creating multiple entity records concurrently, using `Promise.all(items.map(t => entity.create(...)))` results in an N+1 query pattern where N separate HTTP API requests are dispatched sequentially or concurrently to the backend server, causing network overhead and connection contention. Replacing `Promise.all(items.map(...))` with `base44.entities.<Entity>.bulkCreate(...)` merges N operations into a single network payload request.

**Action:** Look for `Promise.all` wrapping `.create()` calls on Base44 entities across the codebase and replace them with `bulkCreate()` calls to cut network request counts by N-1.

## 2026-09-27 - Array Iteration vs flatMap Optimization Nuance

**Learning:** While `flatMap` provides cleaner and more declarative syntax for flattening and mapping nested arrays (such as extraction of unique mineral strings from nearby hotspots), imperative nested `for...of` loops or single-pass Set populating remain faster in V8 due to avoiding intermediate array allocation overhead. Refactoring to `flatMap` improves code readability, but performance impact depends on array sizes.

**Action:** When refactoring nested loops to functional primitives like `flatMap`, measure CPU and memory allocation trade-offs on high-volume hot paths before prioritizing syntactic brevity over loop throughput.
