## 2025-05-18 - External URL Validation Pattern for Href Attributes
**Vulnerability:** Unsanitized user/database external URLs rendered in `<a href={...}>` (such as `permit_url` or `website_url`) can execute arbitrary JavaScript if assigned `javascript:`, `data:`, or `vbscript:` URI schemes, causing DOM-based XSS.
**Learning:** Checking for truthy string existence before rendering links is insufficient; explicit protocol parsing and validation against allowed `http:` and `https:` schemes is necessary to neutralize client-side script execution.
**Prevention:** Always parse and validate external URL strings with `isValidExternalUrl(url)` before passing them into JSX `href` attributes.
