## 2024-03-24 - Missing ARIA Labels on Final Action Buttons\n**Learning:** The final summary/action card in Progressive Verification (PsvFinalCard) lacked aria-labels on its icon-only rescan button. This pattern often occurs in final 'action strips' where space is tight and icons replace text.\n**Action:** Add aria-label attributes to all icon-only action buttons in summary views.

## 2024-03-25 - Missing ARIA Labels on Overlay Icon Buttons
**Learning:** Absolute-positioned icon-only overlay buttons (like "Clear Search" in inputs or "Close" in floating sheets) frequently miss `aria-label`s and proper keyboard focus states. Since they overlay other content, standard focus indicators might be clipped or invisible, leading to poor keyboard accessibility.
**Action:** Always verify that overlay icon buttons have an `aria-label` and explicit keyboard focus indicators like `focus-visible:ring-2`. Ensure border radii match for clean focus rings.

## 2024-07-06 - Keyboard accessibility in Progressive Verification
**Learning:** The PSV mode (Progressive Verification) relies heavily on interactive HUD-like panels, but buttons (like options, take photo, and skip) lacked `focus-visible` styles, making keyboard navigation difficult.
**Action:** Always add explicit `focus-visible:ring-2` styles to interactive `<button>` elements, especially those styled as full-width blocks or icon-only buttons, ensuring users can navigate the application via keyboard. Also, icon-only buttons need an `aria-label`.
## 2026-07-06 - Secure Sanitization for Dynamic CSS in React
**Learning:** Using `dangerouslySetInnerHTML` to inject dynamic CSS variables from user-controlled configuration (e.g., chart colors, IDs) poses a Cross-Site Scripting (XSS) risk if the input is not sanitized. Malicious inputs can break out of the `<style>` tag or CSS context using characters like `;`, `{`, `}`, `<`, `>`, and backslashes.
**Action:** Implement a robust `sanitize` helper function that strips these dangerous characters before interpolating variables into style blocks. For CSS identifiers and values, a whitelist approach or a restrictive blacklist (e.g., `/[;{}<>\\\[\]]/g`) is necessary.
