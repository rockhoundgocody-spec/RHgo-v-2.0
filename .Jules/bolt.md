# Bolt's Journal - Critical Learnings

## 2025-08-15 - React-Leaflet Marker DOM Thrashing via Uncached L.divIcon
**Learning:** Instantiating `L.divIcon(...)` dynamically inside map loop render methods generates a new object reference on every render. Even if the icon SVG content is identical, React-Leaflet checks `prevProps.icon !== nextProps.icon` and invokes `marker.setIcon()`, destroying and re-creating DOM nodes for every single map marker on every state change or pan/zoom update.
**Action:** Always cache `L.divIcon` instances in module-level `Map` objects keyed by parameter combinations (e.g. `${color}_${isActive}_${isGlowing}_${hasGap}_${difficulty}_${highContrast}`) so React-Leaflet maintains reference equality across re-renders and avoids redundant DOM manipulations.
