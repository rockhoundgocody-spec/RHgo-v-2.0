## 2025-05-10 - Single-Pass Linear Scan for Iterative Selection

**Learning:** Sorting an array repeatedly inside a loop to pick the top candidate causes `O(N log N)` evaluation of expensive comparator logic (like trigonometric `haversineKm` distance calculations) per iteration. Using a single-pass linear scan (`O(N)`) computes distance exactly once per candidate per step and avoids sorting array allocations entirely.
**Action:** When implementing greedy or nearest-neighbor selection algorithms in JavaScript/React, use a single-pass minimum scan instead of calling `Array.prototype.sort()` iteratively.
