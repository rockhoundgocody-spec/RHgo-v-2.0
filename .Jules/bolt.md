# Bolt's Performance Journal

## 2025-02-18 - Avoid Re-computing Lookups from Stable API Lists
**Learning:** React hooks like `useMemo` that build lookup Maps (e.g., mineral name to crystal system) can execute expensive loops on every re-render or state change (e.g., when `specimens` array updates) even if the source database lists (`minerals`) are referentially stable from React Query caches. Keying a module-level global `WeakMap` by the stable cache array prevents rebuilding these lookups entirely.
**Action:** When mapping or building lookup tables from stable lists fetched via `useEntityList` or other cached query hooks, use a module-level global `WeakMap` lookup cache keyed by the list array reference to avoid unnecessary recalculations across renders.
