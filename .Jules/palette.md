## 2024-03-24 - Missing ARIA Labels on Final Action Buttons
**Learning:** The final summary/action card in Progressive Verification (PsvFinalCard) lacked aria-labels on its icon-only rescan button. This pattern often occurs in final 'action strips' where space is tight and icons replace text.
**Action:** Add aria-label attributes to all icon-only action buttons in summary views.

## 2025-05-15 - Retrofitting Custom UI with WAI-ARIA
**Learning:** Custom-built interactive components like the `HolographicResult` tabs often bypass standard UI library accessibility features. These need manual implementation of roles (tablist, tab, tabpanel) and relationship attributes (aria-controls, aria-labelledby) to be accessible to screen readers.
**Action:** Always audit custom-built complex UI components for missing ARIA roles and relationships, especially when they replicate common patterns like Tabs or Accordions.
