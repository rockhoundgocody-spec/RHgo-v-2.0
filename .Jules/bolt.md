## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2026-08-24 - Entity Bulk Deletion via deleteMany Prevents O(N+1) HTTP Network Bottlenecks
**Learning:** Fetching all entity records via `.list()` and using `Promise.all(all.map(h => delete(h.id)))` fires N+1 HTTP requests, overwhelming network connections and backend servers.
**Action:** Use `.deleteMany({})` on `@base44/sdk` entity handlers to execute entity bulk deletion in a single O(1) HTTP network request.

## 2026-09-05 - Linear Minimum Scan Replaces Array.prototype.sort in Iterative Route Pathfinding
**Learning:** Sorting remaining candidates on every step of an iterative nearest-neighbour pathfinding loop causes O(N log N) ordering overhead and executes trigonometric calculations (like `haversineKm`) repeatedly per comparison in comparator functions.
**Action:** Use a single-pass O(N) linear scan per selection step to find the minimum distance candidate and splice it out, reducing complexity from O(N log N) to O(N) per step while calculating trigonometric distances exactly once per candidate.
