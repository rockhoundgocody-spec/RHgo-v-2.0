# Sentinel's Journal

## 2026-11-06 - Validating External URLs in User and Chapter Records

**Vulnerability:** External URLs rendered dynamically in `<a href={...}>` (such as `chapter.website_url` in Clubs.jsx or `hotspot.permit_url` in LandAccessPanel.jsx) allow arbitrary URL schemes. Malicious users or compromised records can inject `javascript:...` or `data:...` schemes resulting in DOM-based Cross-Site Scripting (XSS).

**Learning:** When database entities store user-provided or external website/resource links, direct interpolation into React `href` attributes without scheme validation bypasses React's automatic string escaping because `javascript:` is a valid URI format to browsers.

**Prevention:** Always validate external URLs using `isValidExternalUrl` before rendering them in `href` anchors to enforce `http:` or `https:` protocols strictly.
