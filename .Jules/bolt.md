# Bolt's Performance Insights

## 2026-08-18 - Field Selection Projection in @base44/sdk Entity Listing

**Learning:** When generating aggregated metrics or counts from `@base44/sdk` entities, calling `.list()` or `.filter()` without field projections fetches all record properties over the network and loads them into memory. By specifying explicit field arrays (e.g. `['id']` for record counts or `['created_date', 'mineral_name', 'rarity']` for essential attribute aggregations), payload sizes and memory consumption are drastically reduced without requiring backend entity schema or database migrations.
**Action:** Always pass the fourth parameter `fields` array to `base44.entities.<Entity>.list(sort, limit, skip, fields)` when querying entities solely for counts or specific property aggregations.
