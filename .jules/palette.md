## 2025-10-04 - State-Aware Tooltip Hints for Copy/Share Buttons
**Learning:** Icon buttons with dynamic labels (like Share/Copied) benefit significantly from state-aware `title` tooltips on desktop, providing clear guidance on hover/focus when copying specimen information or sharing content.
**Action:** When implementing action buttons with dynamic states, always combine `aria-label` with state-aware `title` tooltip attributes and explicit focus-visible ring styles.

## 2025-10-05 - Contextual Topic and State Guidance for Help Tooltip Triggers
**Learning:** Contextual help trigger buttons (like `HelpTip`) require state-aware and topic-aware `aria-label` and `title` attributes so screen readers and mouse users understand the specific help topic before clicking, and `aria-live="polite"` on the popover panel to announce content upon expanding.
**Action:** Always accept an optional `topic` prop on tooltip triggers to compute dynamic state labels ("Help for [topic]" / "Close help for [topic]") and include `aria-live="polite"` on floating tooltip containers.
