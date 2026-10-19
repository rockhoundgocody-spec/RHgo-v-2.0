## 2026-07-06 - DOM XSS Prevention in User-Supplied External Links
**Vulnerability:** User-controlled or database-stored URLs (such as `permit_url` or `website_url`) rendered directly into anchor `href` attributes enabled arbitrary client-side JavaScript execution via `javascript:` or `data:` schemes.
**Learning:** Checking for truthiness of a URL string before rendering in JSX anchor elements is insufficient to prevent DOM XSS.
**Prevention:** Strictly parse external URL strings with `new URL()` and validate that the protocol matches `http:` or `https:` using `isValidExternalUrl()` before rendering in `href` attributes.
