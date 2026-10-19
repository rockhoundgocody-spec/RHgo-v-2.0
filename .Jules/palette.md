## 2024-05-24 - Interactive Cinematic Tap Layers

**Learning:** Large full-screen structural `div` overlays used for tapping through cinematic/narrative experiences (like `IntroCinematic.jsx`) are completely inaccessible to keyboard users if they only rely on `onClick`. Screen readers will bypass them, and keyboard users will get trapped or unable to advance the story.

**Action:** When implementing full-screen clickable layers (like transparent overlay divs or splash screens), they must be explicitly cast as interactive elements by adding `role="button"`, `tabIndex={0}`, descriptive `aria-label`s, and `onKeyDown` listeners checking for 'Enter' and 'Space' (using `e.preventDefault()` to stop page scrolling), along with `focus-visible` styles using theme colors (e.g., `amethyst-glow`) to ensure the focus state is clearly communicated to sighted keyboard users.

## 2024-05-24 - Hiding Decorative SVG Icons in React Components

**Learning:** When using icon components (like Lucide React's `<ChevronLeft />`, `<Gem />`, etc.) inside an interactive element such as a `<button>` or `<Link>` that already has accessible text (like an `aria-label` or visible label text), screen readers may redundantly announce the SVG or read it as an unlabeled graphic, creating noise for the user.

**Action:** Whenever using SVG icons inside an element that already provides accessible text context, explicitly add `aria-hidden="true"` to the icon component (e.g., `<ChevronLeft aria-hidden="true" />`) to ensure it remains purely decorative to assistive technologies.
