## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2026-08-24 - Batching LocalStorage Writes in Replay Loops
**Learning:** Persisting queue state to `localStorage` (synchronous I/O and `JSON.stringify` serialization) on every single iteration inside an asynchronous write-replay loop introduces severe I/O overhead.
**Action:** Accumulate queue state mutations in memory during loop execution and invoke `saveQueue` once after batch processing completes or when an error interrupts queue processing.
