## 2026-06-11 - Adding aria-label to Remove Photo button in PsvPhotoStage
**Learning:** Icon-only buttons without an aria-label can make screen readers fail to communicate their intent. The removal button for preview photos only contained an 'X' icon.
**Action:** Add aria-label="Remove photo" to ensure accessibility and clear intent.
