# Bolt's Journal - RockHound-GO Performance Optimization

This journal tracks critical, non-obvious performance learnings and architecture bottlenecks discovered in the RockHound-GO codebase.

## 2025-02-14 - Lookup Map Caching with WeakMap
**Learning:** Pre-computing lookup tables or maps inside frequently mounted hooks/components (like `CrystalSystemInsights.jsx` with database entities list) can cause redundant, expensive O(N) array iterations on every component re-render or sibling update.
**Action:** Use a module-level global `WeakMap` cache keyed by referentially stable database arrays (such as the `minerals` list fetched via `useEntityList`) to store pre-computed lookup Maps in O(1), completely eliminating rebuilding loop iterations inside hooks/renders.
