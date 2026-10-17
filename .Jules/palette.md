## 2024-05-24 - Interactive Cinematic Tap Layers

**Learning:** Large full-screen structural `div` overlays used for tapping through cinematic/narrative experiences (like `IntroCinematic.jsx`) are completely inaccessible to keyboard users if they only rely on `onClick`. Screen readers will bypass them, and keyboard users will get trapped or unable to advance the story.

**Action:** When implementing full-screen clickable layers (like transparent overlay divs or splash screens), they must be explicitly cast as interactive elements by adding `role="button"`, `tabIndex={0}`, descriptive `aria-label`s, and `onKeyDown` listeners checking for 'Enter' and 'Space' (using `e.preventDefault()` to stop page scrolling), along with `focus-visible` styles using theme colors (e.g., `amethyst-glow`) to ensure the focus state is clearly communicated to sighted keyboard users.
## 2024-05-18 - Themed Focus Rings
**Learning:** Focus rings (`focus-visible`) should use colors matching the visual theme of the component (e.g., `amethyst-glow/50` for dark/purplish UI areas) rather than relying on default blue browser rings, keeping the UX immersive while remaining accessible.
**Action:** When adding `focus-visible` styles to elements within a distinct UI theme (like the dark/purple "ExploreEmptyState" gradient backgrounds), explicitly specify a themed ring color (like `ring-amethyst-glow/50`) to maintain design consistency alongside accessibility.
