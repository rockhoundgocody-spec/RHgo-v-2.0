## 2024-05-24 - Interactive Cinematic Tap Layers

**Learning:** Large full-screen structural `div` overlays used for tapping through cinematic/narrative experiences (like `IntroCinematic.jsx`) are completely inaccessible to keyboard users if they only rely on `onClick`. Screen readers will bypass them, and keyboard users will get trapped or unable to advance the story.

**Action:** When implementing full-screen clickable layers (like transparent overlay divs or splash screens), they must be explicitly cast as interactive elements by adding `role="button"`, `tabIndex={0}`, descriptive `aria-label`s, and `onKeyDown` listeners checking for 'Enter' and 'Space' (using `e.preventDefault()` to stop page scrolling), along with `focus-visible` styles using theme colors (e.g., `amethyst-glow`) to ensure the focus state is clearly communicated to sighted keyboard users.

## 2025-02-25 - Search Combobox Accessibility & Zero-State Guidance

**Learning:** Search inputs rendering live dropdown results (like `MapSearchBar.jsx`) without WAI-ARIA combobox attributes leave screen reader users unable to announce result availability, keyboard users unable to select matching options via Arrow keys or Enter, and all users confused when typing queries with zero matches due to silent dropdown collapse.

**Action:** Always construct autocomplete/search inputs using `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-controls`, and `aria-activedescendant`. Support `ArrowDown`, `ArrowUp`, `Enter`, and `Escape` keyboard shortcuts, and render an explicit, styled empty state container (`role="status"`) explaining "No matching hotspots found" when queries return no results.
