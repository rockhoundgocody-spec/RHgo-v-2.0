## 2026-09-19 - Consolidate N+1 Entity Creations with bulkCreate

**Learning:** Creating multiple entity records inside a `Promise.all` loop with `.create()` sends N separate HTTP POST requests to the backend, causing unnecessary network latency and database transaction overhead.
**Action:** Replace `Promise.all(items.map(i => base44.entities.<Entity>.create(...)))` with a single `base44.entities.<Entity>.bulkCreate(items.map(...))` call to execute the batch in 1 network roundtrip.
