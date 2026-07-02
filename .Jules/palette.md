## 2025-05-15 - [Accessible Form & Action Controls]

**Learning:** In a specialized UI like RockHound-GO, custom-styled native inputs (like checkboxes) can create accessibility gaps and visual inconsistency. Using established design system components ensures better keyboard support and screen reader compatibility. Additionally, icon-only buttons in complex result screens (like `HolographicResult`) require explicit `aria-label` attributes to be perceivable by assistive technologies.
**Action:** Always audit specialized modals for native HTML inputs that should be replaced with themed `Checkbox` or `Switch` components, and ensure every `Button` with only an icon has a descriptive `aria-label` or `title`.
