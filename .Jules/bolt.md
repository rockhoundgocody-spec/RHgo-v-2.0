
## 2024-05-18 - Admin Hotspot Deletion N+1 Issue
**Learning:** Iterating over a fetched array of entities and calling `.delete(id)` individually triggers an N+1 API storm. For large collections, this drastically increases execution time, memory overhead, and can easily hit API rate limits or cause the browser/client to hang.
**Action:** Always prefer bulk operations (e.g., `deleteMany(query)`) provided by the SDK/ORM over manual mapping. It offloads the work to the server and reduces the operation to a single `O(1)` network request.
