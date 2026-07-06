## 2025-05-22 - Batched Companion Log Optimization

**Learning:** Replacing per-iteration filters with batched queries using the `$in` operator significantly reduces SDK call overhead (from O(N) to O(1) calls for filters). Using `bulkCreate` and `bulkUpdate` further optimizes persistence.

**Action:** When iterating over a collection to perform lookups on related entities, gather unique identifiers first and use a single batched filter query. Group results in-memory using maps for O(1) access inside the loop.
