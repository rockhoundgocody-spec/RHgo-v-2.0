## 2026-07-11 - Explore HUD Button Accessibility
**Learning:** Icon-only buttons in complex mapping interfaces often rely solely on spatial layout for context, completely breaking the experience for screen readers and keyboard users. Applying themed focus states (e.g. `focus-visible:ring-hud-cyan`) ensures that the accessibility focus ring blends seamlessly with the existing design language without looking like an afterthought.
**Action:** When adding `focus-visible` to interactive elements within a specific themed UI (like the dark/cyan HUD mode), intentionally match the focus ring color to the active/theme state of the button (e.g., emerald for geology, cyan for HUD/location) rather than defaulting to standard blue rings.
## 2024-07-15 - AR Accessibility Focus Styles
**Learning:** Found that custom highly-styled animated modals like the AR Encounter screen often miss `focus-visible` ring indicators, making keyboard interactions invisible. These elements typically use custom inline styles or heavily customized Tailwind that strip default browser rings.
**Action:** Always ensure that custom animated buttons (especially those dismissing modals or changing encounter states) explicitly include `focus-visible:outline-none focus-visible:ring-2` to restore keyboard usability without affecting touch/mouse visual design.

## 2024-10-25 - Glassmorphism Navigation Focus Rings
**Learning:** Custom tab navigation and action buttons designed with transparent backdrops and glassmorphism (like CrystalNav and BackButton) easily lose keyboard visibility when standard outlines are disabled. Standard white/black rings clash visually with the dark HUD design.
**Action:** Use theme-aware focus styling (`focus-visible:ring-2 focus-visible:ring-amethyst/50` or `focus-visible:ring-hud-cyan/50`) along with `focus-visible:ring-offset-2 ring-offset-background` and `focus-visible:outline-none` to guarantee high contrast while preserving the cyberpunk dark HUD aesthetic.
