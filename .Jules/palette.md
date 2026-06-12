# Palette's Journal 🎨

Critical UX and accessibility learnings from working on TypeMaster.

## 2025-05-15 - [Skip to Content Link]
**Learning:** For a keyboard-heavy application like a typing master, accessibility for screen readers and keyboard users is paramount. A "Skip to content" link allows users to bypass the navigation and jump straight to the typing interface or dashboard.
**Action:** Always include a skip link in the root layout of web applications with complex navigation.

## 2025-05-20 - [Tooltip for Icon-only Buttons]
**Learning:** Icon-only buttons (like theme toggles or floating palettes) are great for visual minimalism but poor for discoverability and accessibility. Combining Radix UI Tooltips with descriptive `aria-label` attributes ensures both visual users and screen reader users understand the button's purpose without cluttering the UI.
**Action:** Always wrap icon-only buttons in a Tooltip and provide a clear `aria-label`. Use `asChild` on the TooltipTrigger to preserve button semantics.
