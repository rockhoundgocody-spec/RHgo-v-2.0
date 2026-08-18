## 2026-08-18 - Batched Concurrent Database Deletions in Edge Functions
**Learning:** Sequential deletion loops with artificial delays (`setTimeout` in `for...of`) create severe I/O bottlenecks in maintenance edge functions (e.g., deleting duplicate records).
**Action:** Replace sequential deletion loops with batched concurrent operations using `Promise.allSettled` (e.g., chunk sizes of 10) to parallelize API requests while managing rate limits and preserving error handling accuracy.
