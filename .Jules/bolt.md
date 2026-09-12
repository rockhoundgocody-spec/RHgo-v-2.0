## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2026-08-24 - Entity Bulk Deletion via deleteMany Prevents O(N+1) HTTP Network Bottlenecks
**Learning:** Fetching all entity records via `.list()` and using `Promise.all(all.map(h => delete(h.id)))` fires N+1 HTTP requests, overwhelming network connections and backend servers.
**Action:** Use `.deleteMany({})` on `@base44/sdk` entity handlers to execute entity bulk deletion in a single O(1) HTTP network request.

## 2026-09-12 - Single-Pass Linear Minimum Scan Prevents O(N² log N) Trigonometric Bottlenecks
**Learning:** Executing full `Array.prototype.sort()` inside greedy pathfinding loops repeatedly recalculates expensive trigonometric functions (`haversineKm`) across all array items.
**Action:** Use a single-pass linear scan (`O(N)`) to select the minimum item per iteration step, reducing complexity to `O(N)` per step and eliminating sorting overhead.
