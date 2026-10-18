## 2024-05-24 - Interactive Cinematic Tap Layers

**Learning:** Large full-screen structural `div` overlays used for tapping through cinematic/narrative experiences (like `IntroCinematic.jsx`) are completely inaccessible to keyboard users if they only rely on `onClick`. Screen readers will bypass them, and keyboard users will get trapped or unable to advance the story.

**Action:** When implementing full-screen clickable layers (like transparent overlay divs or splash screens), they must be explicitly cast as interactive elements by adding `role="button"`, `tabIndex={0}`, descriptive `aria-label`s, and `onKeyDown` listeners checking for 'Enter' and 'Space' (using `e.preventDefault()` to stop page scrolling), along with `focus-visible` styles using theme colors (e.g., `amethyst-glow`) to ensure the focus state is clearly communicated to sighted keyboard users.

## 2023-10-24 - Hiding Decorator Icons within Buttons
**Learning:** Even when a button contains descriptive text (like "Edit" or "Share"), the accompanying SVG icons (such as those from Lucide) should still be explicitly marked with `aria-hidden="true"`. Otherwise, screen readers may attempt to redundantly announce them alongside the visible text, causing cognitive clutter.
**Action:** When adding icons to buttons, whether icon-only or text-accompanied, always include `aria-hidden="true"` on the icon itself. Focus styles should be applied to the parent `<button>` element.
