## 2024-05-24 - Interactive Cinematic Tap Layers

**Learning:** Large full-screen structural `div` overlays used for tapping through cinematic/narrative experiences (like `IntroCinematic.jsx`) are completely inaccessible to keyboard users if they only rely on `onClick`. Screen readers will bypass them, and keyboard users will get trapped or unable to advance the story.

**Action:** When implementing full-screen clickable layers (like transparent overlay divs or splash screens), they must be explicitly cast as interactive elements by adding `role="button"`, `tabIndex={0}`, descriptive `aria-label`s, and `onKeyDown` listeners checking for 'Enter' and 'Space' (using `e.preventDefault()` to stop page scrolling), along with `focus-visible` styles using theme colors (e.g., `amethyst-glow`) to ensure the focus state is clearly communicated to sighted keyboard users.

## 2024-05-24 - Clearing Search Input Accessibility
**Learning:** Adding an `aria-label` to a parent button (e.g., a "Clear search" button containing an `X` icon) is standard, but failing to explicitly hide the internal decorative SVG icon (e.g., `<X size={14} />`) with `aria-hidden="true"` causes screen readers to potentially stumble by redundantly announcing the graphic alongside the label.
**Action:** Always pair `aria-label` on icon-only interactive elements with `aria-hidden="true"` on the enclosed icon component itself to ensure a clean, singular screen reader announcement.
