# Bolt's Performance Journal

## 2025-08-18 - Single-Pass Collection Dashboard Summary Stat Calculation
**Learning:** Computing multiple aggregate metrics on the same collection using separate `filter()`, `map()`, and `reduce()` calls causes multiple unnecessary array iterations and array allocations on every render.
**Action:** Consolidate multiple array filtering/mapping operations into a single loop inside `useMemo()` to calculate all aggregate summary stats in a single pass ($O(N)$ vs $O(4N)$ plus reduced garbage collection overhead).
