
## 2026-08-18 - Module-level Set lookup vs inline Array allocation
**Learning:** Re-declaring array literals and executing `Array.prototype.includes` inside hot request paths creates unnecessary memory allocations and O(N) lookup overhead on every execution. Hoisting the dataset to a module-level `Set` constant provides O(1) time complexity and eliminates memory allocation per call.
**Action:** Always extract static validation arrays into module-level `Set` constants in function handlers.
