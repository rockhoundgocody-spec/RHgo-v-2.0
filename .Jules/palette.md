## 2024-03-24 - Missing ARIA Labels on Final Action Buttons\n**Learning:** The final summary/action card in Progressive Verification (PsvFinalCard) lacked aria-labels on its icon-only rescan button. This pattern often occurs in final 'action strips' where space is tight and icons replace text.\n**Action:** Add aria-label attributes to all icon-only action buttons in summary views.

## 2024-03-25 - Missing ARIA Labels on Overlay Icon Buttons
**Learning:** Absolute-positioned icon-only overlay buttons (like "Clear Search" in inputs or "Close" in floating sheets) frequently miss `aria-label`s and proper keyboard focus states. Since they overlay other content, standard focus indicators might be clipped or invisible, leading to poor keyboard accessibility.
**Action:** Always verify that overlay icon buttons have an `aria-label` and explicit keyboard focus indicators like `focus-visible:ring-2`. Ensure border radii match for clean focus rings.

## 2024-07-06 - Keyboard accessibility in Progressive Verification
**Learning:** The PSV mode (Progressive Verification) relies heavily on interactive HUD-like panels, but buttons (like options, take photo, and skip) lacked `focus-visible` styles, making keyboard navigation difficult.
**Action:** Always add explicit `focus-visible:ring-2` styles to interactive `<button>` elements, especially those styled as full-width blocks or icon-only buttons, ensuring users can navigate the application via keyboard. Also, icon-only buttons need an `aria-label`.

## 2024-12-16 - Global HUD Navigation Focus States
**Learning:** The application's custom "HUD" design system often suppressed default browser focus outlines without providing an accessible alternative. This made core navigation (CrystalNav) and common actions (Back buttons, Share buttons) inaccessible to keyboard-only users despite their high-contrast visual design.
**Action:** When implementing custom-styled navigation or action buttons, explicitly use `focus-visible:ring-2` with a theme-appropriate color (e.g., `ring-hud-cyan`) to ensure focus states match the HUD aesthetic while maintaining accessibility.
