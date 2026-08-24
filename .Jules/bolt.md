## 2025-05-18 - Pre-computed Rank Properties Prevent O(N²) Render Loops
**Learning:** Calling `Array.prototype.indexOf` inside React `.map()` loops when iterating over lists derived from sorted arrays degrades list rendering performance from O(N) to O(N²).
**Action:** Attach 1-based `rank` or index properties directly to items during the `useMemo` sorting calculation so lookups during list rendering are O(1).

## 2026-07-05 - Module-Level Leaflet divIcon Caching Prevents Marker DOM Thrashing
**Learning:** Instantiating `L.divIcon` inside render loops creates new object references on every render, forcing React-Leaflet to execute `marker.setIcon()` and re-create DOM nodes for every marker on the map.
**Action:** Cache `L.divIcon` instances in module-level `Map` objects keyed by visual property combinations to preserve reference equality across re-renders.
