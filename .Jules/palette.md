## 2026-07-11 - Explore HUD Button Accessibility
**Learning:** Icon-only buttons in complex mapping interfaces often rely solely on spatial layout for context, completely breaking the experience for screen readers and keyboard users. Applying themed focus states (e.g. `focus-visible:ring-hud-cyan`) ensures that the accessibility focus ring blends seamlessly with the existing design language without looking like an afterthought.
**Action:** When adding `focus-visible` to interactive elements within a specific themed UI (like the dark/cyan HUD mode), intentionally match the focus ring color to the active/theme state of the button (e.g., emerald for geology, cyan for HUD/location) rather than defaulting to standard blue rings.
## 2024-07-15 - AR Accessibility Focus Styles
**Learning:** Found that custom highly-styled animated modals like the AR Encounter screen often miss `focus-visible` ring indicators, making keyboard interactions invisible. These elements typically use custom inline styles or heavily customized Tailwind that strip default browser rings.
**Action:** Always ensure that custom animated buttons (especially those dismissing modals or changing encounter states) explicitly include `focus-visible:outline-none focus-visible:ring-2` to restore keyboard usability without affecting touch/mouse visual design.

## 2026-07-16 - Theme-Aware Focus Indicators for HUD Layers
**Learning:** Interactive filters in neon dark HUDs benefit tremendously from distinct, theme-aware focus indicator rings matching their operational domain (e.g., emerald for public spots, sky-400 for rare minerals). This reinforces accessibility and spatial-color cognitive association for keyboard/screen reader navigators.
**Action:** Standardize the use of color-coded focus rings (`focus-visible:ring-{color}/50`) alongside explicit `aria-pressed` states on all multi-themed segmented control layouts to maintain visual consistency and accessibility in glass-morphism views.
