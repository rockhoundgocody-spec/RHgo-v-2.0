## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2025-05-18 - Static Map Lookup Tables Replace O(N) Array Searches
**Learning:** Calling `.find()` on static catalog arrays during repeated function evaluations causes O(N) linear scans on every call. Pre-indexing the catalog array into a `Map` converts lookups to O(1) hash table access.
**Action:** When a static dataset or catalog is queried repeatedly by key/code, construct a module-level `Map` instance to execute O(1) lookups.
