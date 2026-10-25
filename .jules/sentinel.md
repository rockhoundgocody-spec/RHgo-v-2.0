# Sentinel Journal - Security Learnings

## 2025-02-22 - External URL Protocol Validation for DOM XSS Prevention
**Vulnerability:** User-supplied or database-stored external URLs (such as `permit_url` or `website_url`) rendered directly in anchor `href` attributes enabled potential DOM-based Cross-Site Scripting (XSS) via `javascript:`, `data:`, or `file:` URI schemes.
**Learning:** Checking for truthiness of a URL string before rendering an anchor link (`{url && <a href={url}>}`) is insufficient because malicious scheme payloads evaluate to truthy.
**Prevention:** Strictly validate that any external URL protocol is `http:` or `https:` using `new URL(url).protocol` before rendering anchor tags.
