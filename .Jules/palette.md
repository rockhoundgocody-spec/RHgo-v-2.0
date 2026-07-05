## 2025-05-15 - [Keyboard Navigation for Custom Interactions]
**Learning:** When using non-semantic elements (like `div` or `motion.div`) as interactive triggers, adding `role="button"` and `tabIndex={0}` is necessary but insufficient. Users expect 'Enter' or 'Space' to trigger the action, and 'Space' requires `e.preventDefault()` to avoid unwanted page scrolling.
**Action:** Always include a comprehensive `onKeyDown` handler that covers both keys and prevents default scroll behavior for 'Space' when implementing keyboard accessibility for custom components.
