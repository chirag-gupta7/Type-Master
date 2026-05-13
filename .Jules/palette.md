# Palette's Journal 🎨

Critical UX and accessibility learnings from working on TypeMaster.

## 2025-05-15 - [Skip to Content Link]
**Learning:** For a keyboard-heavy application like a typing master, accessibility for screen readers and keyboard users is paramount. A "Skip to content" link allows users to bypass the navigation and jump straight to the typing interface or dashboard.
**Action:** Always include a skip link in the root layout of web applications with complex navigation.

## 2025-05-22 - [Icon-only Button Tooltips]
**Learning:** Sighted users often struggle to identify the purpose of abstract icons (like custom 3D controls or theme palettes) without labels. While `aria-label` solves this for screen readers, visual tooltips are necessary for full accessibility.
**Action:** Every icon-only button must have a descriptive `aria-label` AND a corresponding `Tooltip` (using Radix's `asChild` to maintain semantic button structure). Wrap the application in a global `TooltipProvider` to enable these consistently.
