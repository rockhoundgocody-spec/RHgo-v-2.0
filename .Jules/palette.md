## 2026-06-11 - Adding aria-label to Remove Photo button in PsvPhotoStage
**Learning:** Icon-only buttons without an aria-label can make screen readers fail to communicate their intent. The removal button for preview photos only contained an 'X' icon.
**Action:** Add aria-label="Remove photo" to ensure accessibility and clear intent.

## 2024-XX-XX - Fixing orphaned labels in CorrectionModal
**Learning:** Custom form components like `<Input>` and `<Textarea>` often get detached from their `<label>` elements when IDs are omitted, breaking screen reader associations and reducing click targets.
**Action:** Always pair `htmlFor` on the label with an explicit `id` on the input element for custom forms.

## 2024-XX-XX - Keyboard Focus for Custom Interactive Cards
**Learning:** Custom components like `SlotCard` in `CompareTable` use `button` internally but omit standard focus states. This makes keyboard navigation (Tab) invisible to the user. Using `hover:` classes isn't enough; explicit `focus-visible:` classes are needed.
**Action:** Always pair `hover:` states with `focus-visible:ring-2 focus-visible:outline-none` on interactive custom components to ensure keyboard accessibility.
