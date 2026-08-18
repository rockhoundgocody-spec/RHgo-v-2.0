## 2025-08-18 - Safe DOM Clearing in VirtualScroller

**Vulnerability:** Assignment to `Element.innerHTML` (DOM-based XSS vector and potential unsafe HTML parser sink) when clearing container elements before appending virtualized items.
**Learning:** Using `element.innerHTML = ''` invokes the browser HTML parser needlessly and poses XSS risk if modified or refactored. `element.textContent = ''` safely removes all child nodes without triggering HTML parsing.
**Prevention:** Always use `element.textContent = ''` or `element.replaceChildren()` when clearing container contents in utility libraries or DOM manipulators.
