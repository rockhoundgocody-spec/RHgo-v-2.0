## 2026-08-18 - Set Lookup for Hot-Path Input Validation

**Learning:** Declaring array literals (`['fire', 'gem', 'clap', 'wow']`) inside frequently called request handlers incurs repeated array allocations and linear `Array.prototype.includes()` scan overheads per request.
**Action:** Lift static allowed value collections to module-level `Set` constants (`VALID_REACTIONS = new Set(...)`) and perform constant-time `Set.prototype.has()` checks to eliminate per-request memory allocation and reduce lookup latency.
