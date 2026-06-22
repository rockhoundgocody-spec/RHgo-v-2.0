## 2024-03-24 - Missing ARIA Labels on Final Action Buttons\n**Learning:** The final summary/action card in Progressive Verification (PsvFinalCard) lacked aria-labels on its icon-only rescan button. This pattern often occurs in final 'action strips' where space is tight and icons replace text.\n**Action:** Add aria-label attributes to all icon-only action buttons in summary views.

## 2024-03-24 - Missing Focus Outlines on Interactive Elements
**Learning:** Icon-only interactive elements in Progressive Verification (PsvPhotoStage) lacked accessible `focus-visible` outlines and `aria-label` descriptors, hampering keyboard navigation. Specifically, file upload buttons and image removal buttons need explicit focus definitions.
**Action:** Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white` to tight, image overlay buttons, and `focus-visible:ring-amethyst` for prominent add/action buttons.
