# Performance Insights

## 2026-08-18 - Field Selection for Entity Queries in Backend Edge Functions
**Learning:** Calling `base44.entities.Specimen.list(...)` without specifying fields fetches all columns including high-overhead fields like `image_url`, `ai_candidates` arrays, weather objects, and detailed notes. When aggregating simple attributes (e.g., grouping specimen counts by `mineral_name`), passing field selection (`['mineral_name']`) eliminates over 95% of JSON payload data over the wire and reduces memory allocation.
**Action:** Always specify explicit `fields` arrays when retrieving entity records in edge functions or client hooks if only a subset of attributes is needed.
