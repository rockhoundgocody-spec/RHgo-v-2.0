## 2024-05-24 - Interactive Cinematic Tap Layers

**Learning:** Large full-screen structural `div` overlays used for tapping through cinematic/narrative experiences (like `IntroCinematic.jsx`) are completely inaccessible to keyboard users if they only rely on `onClick`. Screen readers will bypass them, and keyboard users will get trapped or unable to advance the story.

**Action:** When implementing full-screen clickable layers (like transparent overlay divs or splash screens), they must be explicitly cast as interactive elements by adding `role="button"`, `tabIndex={0}`, descriptive `aria-label`s, and `onKeyDown` listeners checking for 'Enter' and 'Space' (using `e.preventDefault()` to stop page scrolling), along with `focus-visible` styles using theme colors (e.g., `amethyst-glow`) to ensure the focus state is clearly communicated to sighted keyboard users.

## 2025-02-18 - Form Bottom Sheet Accessibility & Switch Controls

**Learning:** Bottom sheet modals containing form controls and toggles (like `CreateListingSheet.jsx`) often lack key screen reader hooks (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) and label associations. Non-native switches without `role="switch"` and `aria-checked` fail to communicate toggle state to assistive technologies, while missing `focus-visible` styles leave keyboard navigation invisible.

**Action:** Wrap bottom sheet modals in `role="dialog"` with `aria-modal="true"` and `aria-labelledby`, hook `window.addEventListener('keydown')` for `Escape` dismissal, generate matching input/label IDs with React's `useId()`, and apply `role="switch"`, `aria-checked`, and `focus-visible` ring utility classes to custom toggle controls.
