## 2026-07-15 - Programmatic File Input Ghost Focus Pattern
**Learning:** Converting a hidden programmatic `<input type="file" />` element to `sr-only` is an accessibility regression if it is paired with an already natively-focusable visible trigger button. The `sr-only` input gets included in the keyboard tab sequence, causing a "ghost focus" (tab trap) with no visual feedback.
**Action:** Keep the programmatically triggered input fully hidden using the `hidden` class (or use `tabIndex={-1}`) to prevent keyboard focus on invisible elements, and apply robust `focus-visible` styles and overlay feedback directly to the visible triggering button.

## 2026-07-11 - Explore HUD Button Accessibility
**Learning:** Icon-only buttons in complex mapping interfaces often rely solely on spatial layout for context, completely breaking the experience for screen readers and keyboard users. Applying themed focus states (e.g. `focus-visible:ring-hud-cyan`) ensures that the accessibility focus ring blends seamlessly with the existing design language without looking like an afterthought.
**Action:** When adding `focus-visible` to interactive elements within a specific themed UI (like the dark/cyan HUD mode), intentionally match the focus ring color to the active/theme state of the button (e.g., emerald for geology, cyan for HUD/location) rather than defaulting to standard blue rings.
## 2024-07-15 - AR Accessibility Focus Styles
**Learning:** Found that custom highly-styled animated modals like the AR Encounter screen often miss `focus-visible` ring indicators, making keyboard interactions invisible. These elements typically use custom inline styles or heavily customized Tailwind that strip default browser rings.
**Action:** Always ensure that custom animated buttons (especially those dismissing modals or changing encounter states) explicitly include `focus-visible:outline-none focus-visible:ring-2` to restore keyboard usability without affecting touch/mouse visual design.

## 2023-10-27 - File Input Accessibility Pattern
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the tab sequence completely, making custom upload buttons inaccessible to keyboard users.
**Action:** Always use `className="sr-only"` on the hidden file input and apply `focus-within` styles (like `focus-within:ring-2`) to the visible parent `<label>` wrapper so visual feedback is provided when the hidden input receives focus.
## 2024-08-01 - Post Composer Image Upload Accessibility
**Learning:** Found that custom file upload buttons in the community post composer often use `className="hidden"` on the `<input type="file">`, which completely removes them from the accessibility tree, making them invisible to screen readers and keyboard users.
**Action:** Replace `className="hidden"` with `className="sr-only"` on hidden file inputs and apply `focus-within:ring-2 focus-within:ring-white/50 focus-within:outline-none` to the parent `<label>` wrapper so that keyboard focus is visually indicated when the input receives focus.
## 2024-06-25 - Avoid unintended scope creep with dependencies during visual verification
**Learning:** During visual verification of micro-UX improvements in specific components (e.g. `AgateGuide.jsx`), broken dev servers due to missing dependencies in other areas of the application (like `leaflet.css` in `HotspotMap.jsx`) can prompt agents to unintentionally fix unrelated issues by installing new packages or creating debug routes.
**Action:** When a dev server fails due to a missing dependency outside the scope of the targeted micro-UX change, NEVER add the dependency to package.json. Rely on static checks (linting/unit tests) for verification, and do not introduce unauthorized routing changes purely for visual verification. Always ensure the PR only contains changes strictly related to the assigned micro-UX task.
