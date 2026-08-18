## 2026-08-18 - Concurrent Batch Processing for Web Crawler Edge Functions
**Learning:** Sequential HTTP and LLM calls in crawler loops accumulate significant I/O latency (~400ms delay + HTTP/LLM roundtrips per item), causing potential function timeouts and severe execution slowdowns when processing batches.
**Action:** Use `Promise.all` over filtered candidate batches to execute detail fetches and LLM data extractions concurrently, reducing batch processing time from O(N) to O(1) concurrent requests while preserving error handling and bulk-insert semantics.
