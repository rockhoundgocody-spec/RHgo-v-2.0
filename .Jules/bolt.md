## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## Parallelization of Independent File Uploads in Chronolith

**Learning:** Sequential `await` in `for...of` loops for file uploads incurs additive latency penalty (N * latency). Replacing independent `await` calls with `Promise.all(files.map(...))` executes network uploads concurrently, reducing total wait time to ~1 * max_latency.

**Action:** Whenever handling multiple file uploads or independent async network requests, prefer `Promise.all()` over sequential `await` loops.
