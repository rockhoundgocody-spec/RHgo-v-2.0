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

## 2024-08-05 - Keyboard Focus Overlays for Avatar Uploads
**Learning:** When custom file uploads use overlay indicators (like a camera icon showing only on hover over an avatar), keyboard-only users will miss the indicator unless `group-focus-visible:opacity-100` or `focus-visible:opacity-100` is also added to the overlay.
**Action:** When styling custom file uploads or avatar controls with interactive hover overlays, always pair pointer hover states (like `group-hover:opacity-100`) with keyboard focus states (such as `group-focus-visible:opacity-100` or `focus-within:opacity-100`) to guarantee equivalent visual feedback across all devices.
