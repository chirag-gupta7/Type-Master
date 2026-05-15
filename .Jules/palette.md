# Palette's Journal 🎨

Critical UX and accessibility learnings from working on TypeMaster.

## 2025-05-15 - [Skip to Content Link]
**Learning:** For a keyboard-heavy application like a typing master, accessibility for screen readers and keyboard users is paramount. A "Skip to content" link allows users to bypass the navigation and jump straight to the typing interface or dashboard.
**Action:** Always include a skip link in the root layout of web applications with complex navigation.

## 2025-05-16 - [Tooltips for Icon-only Buttons]
**Learning:** Icon-only buttons (like theme toggles or floating selectors) provide insufficient visual feedback for their action, especially for new users. While `aria-label` handles screen readers, Tooltips provide the necessary context for visual users without cluttering the UI.
**Action:** Every icon-only button should be paired with a Tooltip that describes its action, ensuring both accessibility and intuitive UX.
