
## 2025-05-18 - Optimize Collection Map and Aggregation Loop

**Learning:** Updating Map counters with `map.set(key, (map.get(key) || 0) + 1)` causes double map lookup overhead on every item iteration. Additionally, allocating temporary `Set` objects alongside Map tracking, invoking `.split(',')[0]` inside tight loops, and instantiating `Date` objects for repeated timeline interval comparisons introduce significant CPU and GC thrashing.

**Action:** Look up Map counts into local variables once (`const c = map.get(k); map.set(k, c ? c + 1 : 1)`), utilize `map.size` instead of secondary `Set` allocations, extract substrings using `indexOf(',')`/`slice()`, and pre-compute numeric timestamp arrays (`getTime()`) for range checks.
