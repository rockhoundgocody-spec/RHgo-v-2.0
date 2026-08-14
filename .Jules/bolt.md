## 2024-05-19 - N+1 Issue during entity deletion
**Learning:** In scenarios requiring deletion or manipulation of multiple backend entities, fetching a list and mapping over them to trigger individual SDK operations (like `base44.entities.Hotspot.delete(id)`) introduces a severe N+1 HTTP request bottleneck, potentially hitting rate limits and UI hangs.
**Action:** Use bulk methods provided by the SDK (like `base44.entities.Hotspot.deleteMany(query)`) instead. This optimizes requests significantly.
