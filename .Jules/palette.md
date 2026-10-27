## 2024-05-24 - Interactive Cinematic Tap Layers

**Learning:** Large full-screen structural `div` overlays used for tapping through cinematic/narrative experiences (like `IntroCinematic.jsx`) are completely inaccessible to keyboard users if they only rely on `onClick`. Screen readers will bypass them, and keyboard users will get trapped or unable to advance the story.

**Action:** When implementing full-screen clickable layers (like transparent overlay divs or splash screens), they must be explicitly cast as interactive elements by adding `role="button"`, `tabIndex={0}`, descriptive `aria-label`s, and `onKeyDown` listeners checking for 'Enter' and 'Space' (using `e.preventDefault()` to stop page scrolling), along with `focus-visible` styles using theme colors (e.g., `amethyst-glow`) to ensure the focus state is clearly communicated to sighted keyboard users.

## 2025-10-05 - Accessible Search Combobox Pattern with WAI-ARIA and Keyboard Navigation

**Learning:** Search dropdowns (such as MapSearchBar) require explicit `role="combobox"`, `role="listbox"`, `role="option"`, `aria-expanded`, `aria-controls`, and `aria-activedescendant` attributes paired with `ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Home`, and `End` key handling to allow seamless screen-reader and keyboard navigation through hotspot and mineral search results.

**Action:** Whenever building search inputs with autocomplete dropdowns, pair WAI-ARIA combobox markup with keyboard selection state (`selectedIndex`), input refocusing on search clear, and state-aware visual highlights on hover and active options.
