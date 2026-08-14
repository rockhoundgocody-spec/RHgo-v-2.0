## 2026-08-14 - Parallelize Uploads with Promise.all
**Learning:** Sequential async operations in loops (e.g., `for...of` with `await`) add unnecessary total latency equal to the sum of individual delays.
**Action:** Use `Promise.all()` with `.map()` to launch independent async operations concurrently.
