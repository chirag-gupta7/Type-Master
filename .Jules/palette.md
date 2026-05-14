# Palette's Journal 🎨

Critical UX and accessibility learnings from working on TypeMaster.

## 2025-05-15 - [Skip to Content Link]
**Learning:** For a keyboard-heavy application like a typing master, accessibility for screen readers and keyboard users is paramount. A "Skip to content" link allows users to bypass the navigation and jump straight to the typing interface or dashboard.
**Action:** Always include a skip link in the root layout of web applications with complex navigation.

## 2026-05-14 - [Tooltips for Icon-only Buttons]
**Learning:** Icon-only buttons (like theme toggles or mobile menus) can be ambiguous for sighted users. Providing a descriptive tooltip that reflects the current state or intended action significantly improves clarity and discoverability without cluttering the UI.
**Action:** Wrap all icon-only buttons in a `Tooltip` and ensure the tooltip text is descriptive (e.g., specifying "light mode" vs "dark mode" instead of just "theme").
