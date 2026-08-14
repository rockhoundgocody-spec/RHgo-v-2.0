
## 2024-05-18 - Optimize DeleteAccountDialog with deleteMany
**Learning:** Sequential `.delete(id)` operations on fetched arrays trigger N+1 network request cascades, leading to extreme slowness and potential browser connection limit bottlenecking.
**Action:** When a bulk deletion is conceptually simple (e.g., "delete all by owner_email"), always prefer using `@base44/sdk`'s `.deleteMany(query)` method, resolving multiple entities simultaneously and drastically decreasing round-trip time.
