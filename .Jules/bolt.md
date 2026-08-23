## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2026-03-30 - Avoid Date Object Instantiations inside Tight Sequential Loops
**Learning:** Instantiating `new Date()` objects inside tight sequential comparison loops (e.g., date streak calculations) creates redundant memory allocations and causes V8 string-parsing overhead on every iteration.
**Action:** Pre-parse timestamps or track previous timestamps using `Date.parse()` across loop iterations to eliminate `Date` object creation and reduce execution time by up to ~2.8x.
