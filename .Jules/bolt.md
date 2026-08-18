# Bolt Journal

## 2025-05-18 - Isolate Map Lookup Construction from Specimen Re-computations

**Learning:** Rebuilding a large `Map` (e.g. mapping mineral names to crystal systems) inside a `useMemo` block that depends on frequently changing props (such as `specimens`) causes unnecessary `Map` allocations and iterations on every specimen re-render. Splitting lookup map construction into a dedicated `useMemo` hook that strictly depends on `minerals` avoids redundant $O(N)$ operations.

**Action:** Whenever a lookup dictionary or `Map` is derived from a slowly-changing dataset (like reference tables or database list queries) to compute metrics on a fast-changing dataset (like user specimens or active state), extract the lookup creation into its own `useMemo` hook.
