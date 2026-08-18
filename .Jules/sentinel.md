## 2026-08-18 - Safe DOM Clearing in VirtualScroller

**Vulnerability:** Assignment to `Element.innerHTML = ''` invokes the HTML parser and creates DOM-based XSS vectors if dynamic string content is processed or parsed during DOM clearing.
**Learning:** `element.textContent = ''` or `element.replaceChildren()` safely empties child nodes in DOM containers without triggering HTML parsing overhead or potential XSS injection vulnerabilities.
**Prevention:** Avoid `innerHTML = ''` when clearing DOM containers; prefer `textContent = ''` or `replaceChildren()`.
