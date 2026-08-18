## 2026-08-18 - Single-Pass Loop Optimization for Unique Array Item Filtering

**Learning:** Using nested `.forEach()` loops with optional chaining and repeated `.trim()` calls (`h => (h.minerals || []).forEach(m => if (m?.trim()) set.add(m.trim()))`) incurs significant overhead from closure creations, array allocations (`|| []`), and redundant string allocations (`m.trim()` evaluated twice per item). Replaces this with an imperative single-pass `for` loop that checks types and trims once reduces overhead significantly.

**Action:** When gathering unique elements from nested arrays in hot memoized paths, extract the logic into a dedicated helper function using plain single-pass `for` loops and single string transformations per item.
