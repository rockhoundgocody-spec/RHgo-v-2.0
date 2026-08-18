# Bolt's Journal - Performance Insights

## 2026-08-18 - Parallelized Crawling in Mindat Crawler

**Learning:** Sequential HTTP requests in a loop with manual politeness delay (`sleep(400)`) caused significant N*T execution latency when crawling mineral detail pages in `crawlMindat`. Replacing sequential loops with `Promise.all` concurrency reduces total batch request duration from O(N) to ~O(1) relative to single-request latency.
**Action:** When handling independent I/O fetches or LLM calls in edge functions or workers, process items in parallel with `Promise.all` instead of awaiting sequentially in `for...of` loops.
