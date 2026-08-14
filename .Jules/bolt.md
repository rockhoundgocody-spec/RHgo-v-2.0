## 2025-03-04 - Abstracting Long React Animation Loops
**Learning:** Monolithic animation loops within a `useEffect` using `requestAnimationFrame` cause severe cyclomatic complexity. Breaking them into smaller pure functions outside the component maintains state references and significantly boosts readability and maintainability.
**Action:** In future HTML Canvas implementations inside React, extract static or semi-static drawing functions to module scope to keep component bodies clean and focused.
