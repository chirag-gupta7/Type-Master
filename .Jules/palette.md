# Palette's Journal 🎨

Critical UX and accessibility learnings from working on TypeMaster.

## 2025-05-15 - [Skip to Content Link]
**Learning:** For a keyboard-heavy application like a typing master, accessibility for screen readers and keyboard users is paramount. A "Skip to content" link allows users to bypass the navigation and jump straight to the typing interface or dashboard.
**Action:** Always include a skip link in the root layout of web applications with complex navigation.

## 2025-05-22 - [Icon-only Button Tooltips]
**Learning:** Icon-only buttons (like theme toggles or floating actions) can be ambiguous for some users. While `aria-label` provides accessibility for screen readers, visual tooltips are necessary to provide the same clarity to sighted users without cluttering the interface with permanent text labels.
**Action:** Always wrap icon-only buttons in a Tooltip component to ensure their function is clear to all users. Use dynamic tooltip content for toggle buttons to reflect the state change.
