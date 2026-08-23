## 2025-05-24 - Fix CSS Injection in ChartStyle Component

**Vulnerability:**
`ChartStyle` in `src/components/ui/chart.jsx` rendered dynamic CSS declarations inside a `<style>` tag using `dangerouslySetInnerHTML`. User-controlled or dynamic chart config inputs (`id`, item keys, or theme/color values) could inject malicious CSS rules or close the `<style>` tag to execute arbitrary JavaScript (`</style><script>...`).

**Learning:**
Using raw HTML string interpolation (`dangerouslySetInnerHTML`) inside `<style>` elements circumvents React's automatic escaping protections. Characters like `<`, `>`, `{`, `}`, `;`, `\`, and quote characters can break CSS syntax or terminate HTML contexts.

**Prevention:**
Filter/sanitize `id` and CSS property key names to strict alphanumeric and hyphen/underscore characters (`/[^a-zA-Z0-9_-]/g`). Strip dangerous CSS/HTML control characters (`/[<>{};\\`"']/g`) from color string values. Render the sanitized CSS string directly as a React child node `<style>{cssText}</style>` rather than using `dangerouslySetInnerHTML`.
