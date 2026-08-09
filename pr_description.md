🔒 Sentinel: [HIGH] Fix potential DOM-based XSS in performanceOptimization

🎯 **What:**
Fixed a potential DOM-based XSS vulnerability in the `VirtualScroller` class inside `src/lib/performanceOptimization.js`. The method `render()` previously used `this.container.innerHTML = '';` to clear the DOM container before re-rendering list items.

⚠️ **Risk:**
While this specific instance might not immediately receive user input that executes scripts, using `innerHTML` to clear a node invokes the browser's HTML parser. If any parent logic mistakenly injects unsafe data into the container before or around this operation, or if the method is refactored in the future, it creates a surface area for Cross-Site Scripting (XSS). An attacker could exploit this to inject malicious scripts, potentially leading to session hijacking, unauthorized actions, or data theft.

🛡️ **Solution:**
Replaced `this.container.innerHTML = '';` with `this.container.textContent = '';`. This is a safer and faster alternative that directly clears the text content (and thus child nodes) without invoking the HTML parser, entirely eliminating this XSS attack vector.

Verification:
- Tested standard build and verified tests pass successfully.
- Linting checks passed for the modified file.
