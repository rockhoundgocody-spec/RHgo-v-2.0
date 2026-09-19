## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2026-08-24 - Entity Bulk Deletion via deleteMany Prevents O(N+1) HTTP Network Bottlenecks
**Learning:** Fetching all entity records via `.list()` and using `Promise.all(all.map(h => delete(h.id)))` fires N+1 HTTP requests, overwhelming network connections and backend servers.
**Action:** Use `.deleteMany({})` on `@base44/sdk` entity handlers to execute entity bulk deletion in a single O(1) HTTP network request.

## 2026-09-19 - Carrying Forward Parsed Timestamps in Sequential Date Streak Calculations
**Learning:** Re-parsing date strings or formatted template strings (`Date.parse("${sortedDays[i - 1]}T00:00:00Z")`) inside sequential comparisons recreates expensive string formatting and parsing overhead on every loop iteration (redundant Date.parse calls).
**Action:** Store the parsed timestamp of the current iteration (`previous = current`) to carry it forward into the next iteration, reducing `Date.parse` calls per comparison step from 2 to 1.
