## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2025-08-23 - Parallelize Sequential Async File Uploads in Chronolith

**Learning:** Using a sequential `for...of` loop with `await` on multiple independent file upload requests (`base44.integrations.Core.UploadFile`) causes an N*latency bottleneck where each upload waits for the previous network request to finish. Replacing sequential execution with `Promise.all` allows browser network requests to run concurrently.

**Action:** Whenever multiple independent I/O or network API requests are executed over an array of items, prefer `Promise.all(items.map(...))` to maximize network concurrency and reduce total wait duration.
