## 2024-05-24 - N+1 Bottleneck in base44 SDK
**Learning:** Mapping over an array of entities and calling `.delete()` on each one generates N+1 network requests, hanging the client and hitting rate limits for large lists (e.g., clearing all hotspots).
**Action:** Use `deleteMany({})` for bulk deletion via the `@base44/sdk` which achieves significant speedups by collapsing all removals into a single HTTP operation.
