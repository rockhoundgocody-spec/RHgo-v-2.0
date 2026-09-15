## 2026-07-11 - Explore HUD Button Accessibility
**Learning:** Icon-only buttons in complex mapping interfaces often rely solely on spatial layout for context, completely breaking the experience for screen readers and keyboard users. Applying themed focus states (e.g. `focus-visible:ring-hud-cyan`) ensures that the accessibility focus ring blends seamlessly with the existing design language without looking like an afterthought.
**Action:** When adding `focus-visible` to interactive elements within a specific themed UI (like the dark/cyan HUD mode), intentionally match the focus ring color to the active/theme state of the button (e.g., emerald for geology, cyan for HUD/location) rather than defaulting to standard blue rings.
## 2024-07-15 - AR Accessibility Focus Styles
**Learning:** Found that custom highly-styled animated modals like the AR Encounter screen often miss `focus-visible` ring indicators, making keyboard interactions invisible. These elements typically use custom inline styles or heavily customized Tailwind that strip default browser rings.
**Action:** Always ensure that custom animated buttons (especially those dismissing modals or changing encounter states) explicitly include `focus-visible:outline-none focus-visible:ring-2` to restore keyboard usability without affecting touch/mouse visual design.

## 2023-10-27 - File Input Accessibility Pattern
**Learning:** Using `className="hidden"` on `<input type="file">` removes it from the tab sequence completely, making custom upload buttons inaccessible to keyboard users.
**Action:** Always use `className="sr-only"` on the hidden file input and apply `focus-within` styles (like `focus-within:ring-2`) to the visible parent `<label>` wrapper so visual feedback is provided when the hidden input receives focus.
## 2024-08-01 - Post Composer Image Upload Accessibility
**Learning:** Found that custom file upload buttons in the community post composer often use `className="hidden"` on the `<input type="file">`, which completely removes them from the accessibility tree, making them invisible to screen readers and keyboard users.
**Action:** Replace `className="hidden"` with `className="sr-only"` on hidden file inputs and apply `focus-within:ring-2 focus-within:ring-white/50 focus-within:outline-none` to the parent `<label>` wrapper so that keyboard focus is visually indicated when the input receives focus.
## 2024-06-25 - Avoid unintended scope creep with dependencies during visual verification
**Learning:** During visual verification of micro-UX improvements in specific components (e.g. `AgateGuide.jsx`), broken dev servers due to missing dependencies in other areas of the application (like `leaflet.css` in `HotspotMap.jsx`) can prompt agents to unintentionally fix unrelated issues by installing new packages or creating debug routes.
**Action:** When a dev server fails due to a missing dependency outside the scope of the targeted micro-UX change, NEVER add the dependency to package.json. Rely on static checks (linting/unit tests) for verification, and do not introduce unauthorized routing changes purely for visual verification. Always ensure the PR only contains changes strictly related to the assigned micro-UX task.
## 2026-10-31 - File Input Focus Interaction inside Labels
**Learning:** Replacing `className="hidden"` with `className="sr-only"` on file inputs inside `<label>` elements allows the parent `<label>` to correctly reflect keyboard focus via `focus-within` styles without changing visual layout.
**Action:** When making custom file upload inputs keyboard accessible, use `sr-only` on the `<input>`, wrap it within the `<label>`, and use `focus-within` on the label to visually indicate focus state.
## 2024-11-20 - Navigable Cards and Nested Interactive Elements
**Learning:** Navigable cards (like `<Link>` containers) often contain nested interactive elements (like expand/collapse buttons or share buttons). If the parent container does not have focus styles, keyboard users cannot tell which card they are on. Furthermore, expand/collapse toggles require `aria-expanded` attributes to properly communicate their state to screen readers.
**Action:** Ensure parent navigable cards have `focus-visible` styles to indicate focus. Add `aria-expanded` to nested expand/collapse buttons and ensure all nested interactive elements have consistent `focus-visible` styles that match the theme of the card.
## 2024-03-01 - HUD Scan Overlay Accessibility
**Learning:** Found that custom highly-styled action bars and toggles within immersive AR/Scan HUDs often lack visual focus indicators. This severely impairs keyboard navigability in complex multi-angle capture or toggling interfaces.
**Action:** When working on complex immersive HUD components (like Torch buttons or Wet/Dry context toggles), explicitly add `focus-visible:outline-none focus-visible:ring-2` combined with a complementary theme color (e.g. `focus-visible:ring-yellow-500/50` or `focus-visible:ring-hud-cyan/50`) to ensure the accessibility focus ring blends seamlessly with the existing design language without looking like an afterthought.

## 2024-08-13 - [DailyCheckIn Accessibility Enhancement]
**Learning:** Decorative emojis in custom button groups (like mood selectors) can cause screen reader clutter, and custom active states (like picking a mood) aren't announced by default.
**Action:** When building custom option selectors with emojis, always wrap the emoji in `<span aria-hidden="true">` and use `aria-pressed={isActive}` on the `<button>` so the screen reader properly announces state changes without reading the decorative icon.
## 2024-11-21 - Custom Layer Toggle Button Accessibility
**Learning:** Found that custom horizontal scrolling filter bars (like the MapLayerPanel) often use highly customized `motion.button` elements that completely strip default focus rings and lack ARIA state indicators. This makes it impossible for screen reader users to know which layer is currently active, and keyboard users lose their place entirely.
**Action:** Always ensure that custom styled toggle buttons (especially those inside horizontal scrolling menus) explicitly include `aria-pressed={active}` to communicate state to screen readers, and add `focus-visible:outline-none focus-visible:ring-2` to restore keyboard usability.
## 2024-11-21 - Custom Accordion/Toggle Accessibility
**Learning:** Found that custom accordion-style toggle buttons (like those in PsvDeltaLog) frequently omit standard ARIA state attributes (`aria-expanded`, `aria-controls`) and custom focus indicators (`focus-visible`). This forces screen readers to treat them as generic buttons and leaves keyboard users without visual cues of focus.
**Action:** Always ensure that custom expand/collapse toggles explicitly include `aria-expanded={isOpen}`, `aria-controls="[content-id]"`, and `focus-visible:outline-none focus-visible:ring-2` styling. Ensure the associated expandable content div actually has the matching `id`.
## 2024-11-21 - Custom Input Accessible Focus within Glass Panels
**Learning:** Adding accessibility features to inputs housed within custom "GlassPanel" containers can be tricky because the background relies on transparency, and standard focus rings look unnatural or clash with custom border styles (like `1px solid hsla(...)`).
**Action:** Always maintain the design aesthetic when adding `focus-visible:ring-2`. When standard rings clash, combine `focus-visible:outline-none` with `focus-visible:ring-2 focus-visible:ring-white/50` (or `amethyst-glow/50` for primary actions) to ensure the focus state is obvious but visually coherent with the glassmorphism theme.
## 2026-08-24 - Accessible Disclosure Widgets
**Learning:** In a highly themed UI, standard focus indicators might clash or be invisible. However, combining focus rings (`focus-visible:ring-2`) with a slight border radius (`rounded-sm`) improves the visual box for textual toggle buttons that sit flush with their containers.
**Action:** When adding ARIA expanded states to inline text toggle buttons, include a subtle border radius if applying focus rings, ensuring the ring outlines a neat rectangle rather than clipping awkwardly against text boundaries.
## 2026-08-25 - Accessible Nearby Places Panel
**Learning:** The NearbyPlacesPanel component had interactive category chips functioning as toggles but lacked ARIA properties to communicate their active state to screen readers. Focus rings should use context-specific colors (e.g. hud-cyan) to match the dark UI.
**Action:** Apply `aria-pressed` to toggle buttons, ensure external links have descriptive `aria-label` attributes, and always use themed focus-visible states (`focus-visible:ring-hud-cyan/60`) for keyboard accessibility.
## 2024-08-30 - Accordion Accessibility Patterns in Framer Motion components
**Learning:** Collapsible accordion-style components using `<motion.div>` for animation require `useId` for robust aria-controls linking between the toggle button and the expandable body, while decorative chevron icons toggled by the state should be marked with `aria-hidden="true"`.
**Action:** When auditing custom UI elements with collapsible/expandable sections, systematically verify the presence of `aria-expanded` and `aria-controls` on the trigger, and `id` on the target container, ensuring a seamless screen reader experience.
## 2024-11-21 - Accessible Dynamic Lists
**Learning:** Found that dynamically generated list elements (like suggested routes mapped over arrays) often use plain buttons for navigation, but lack `aria-label`s to clearly communicate their purpose (e.g. what pressing the button will actually do) to screen reader users when the inner text is heavily styled or truncated.
**Action:** Always add explicit `aria-label` attributes to dynamically generated navigation buttons mapped from lists to ensure screen readers provide useful, actionable context.

## 2024-05-18 - Native File Upload Accessibility
**Learning:** Using JavaScript `useRef` to proxy clicks from an inaccessible `<button>` to a hidden `<input type="file" className="hidden">` fundamentally breaks keyboard accessibility, as the hidden input cannot receive focus and the button lacks native file picker semantics.
**Action:** When implementing custom file upload buttons in this codebase, wrap the `<input type="file">` inside a `<label>`. Use `className="sr-only"` on the input to keep it visually hidden but focusable, and apply `cursor-pointer focus-within:ring-2 focus-within:outline-none` directly to the `<label>` to leverage native HTML semantics and provide visual focus indication.
