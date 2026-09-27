# Bolt's Journal

## 2026-09-27 - Map Component Abstraction
**Learning:** Map components (`CollectionMap` and `ExpeditionMapView`) shared identical Google Map initialization logic, dark styling configuration, and marker creation/cleanup lifecycle patterns.
**Action:** Extract shared map styles into `src/lib/googleMapStyles.js` and map instance/marker lifecycle logic into `useGoogleMap` custom hook (`src/lib/useGoogleMap.js`) to reduce code duplication and streamline map maintenance across components.
