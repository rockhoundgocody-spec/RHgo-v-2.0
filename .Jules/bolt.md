## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2026-08-24 - Batch LocalStorage Write Operations in Async Loops
**Learning:** Persisting queue state to `localStorage` on every iteration of an async processing loop creates redundant synchronous storage I/O and JSON serialization overhead (O(N) storage writes for N items).
**Action:** Track state mutations during loop processing with a flag and defer queue persistence to a single `finally` block or loop exit hook, reducing storage I/O operations to O(1).
