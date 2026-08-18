## 2025-08-18 - Batching DB Entity Creates with bulkCreate

**Learning:** When generating multiple entity records within edge functions (e.g., seeding or batch processing), sequential `entities.<Entity>.create` calls inside a loop create an N+1 HTTP request overhead where latency scales linearly with candidate count ($O(N)$ network roundtrips). `@base44/sdk` supports `bulkCreate(dataArray)` which posts the payload in a single HTTP batch endpoint, reducing latency overhead to $O(1)$ roundtrips.

**Action:** Whenever creating multiple entity instances in a loop, accumulate candidate objects into an array and call `bulkCreate(array)` if non-empty, handling batch errors cleanly.
