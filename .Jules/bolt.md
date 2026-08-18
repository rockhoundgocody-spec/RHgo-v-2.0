## 2025-08-18 - Targeted Batch Querying in Edge Function Deduplication

**Learning:** Replacing unbounded `.list()` calls on entity tables with targeted batch `.filter({ name: { $in: candidateNames } }, undefined, limit, 0, ['name'])` prevents fetching all table records into edge function memory, avoiding severe CPU and memory bloat as table size grows.

**Action:** Whenever checking for existing records during batch ingestion or crawling, filter specifically for candidate keys in chunks and project only required fields (`['name']`) rather than fetching the full entity dataset.
