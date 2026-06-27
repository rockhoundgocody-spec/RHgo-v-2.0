## 2024-03-24 - Missing ARIA Labels on Final Action Buttons\n**Learning:** The final summary/action card in Progressive Verification (PsvFinalCard) lacked aria-labels on its icon-only rescan button. This pattern often occurs in final 'action strips' where space is tight and icons replace text.\n**Action:** Add aria-label attributes to all icon-only action buttons in summary views.

## 2024-03-25 - Missing ARIA Labels on Overlay Icon Buttons
**Learning:** Absolute-positioned icon-only overlay buttons (like "Clear Search" in inputs or "Close" in floating sheets) frequently miss `aria-label`s and proper keyboard focus states. Since they overlay other content, standard focus indicators might be clipped or invisible, leading to poor keyboard accessibility.
**Action:** Always verify that overlay icon buttons have an `aria-label` and explicit keyboard focus indicators like `focus-visible:ring-2`. Ensure border radii match for clean focus rings.
