# Palette's Journal 🎨

Critical UX and accessibility learnings from working on TypeMaster.

## 2025-05-15 - [Skip to Content Link]
**Learning:** For a keyboard-heavy application like a typing master, accessibility for screen readers and keyboard users is paramount. A "Skip to content" link allows users to bypass the navigation and jump straight to the typing interface or dashboard.
**Action:** Always include a skip link in the root layout of web applications with complex navigation.

## 2025-05-16 - [Tooltips for Icon-Only Buttons]
**Learning:** Icon-only buttons (like theme toggles or palette switches) are common in modern UI but are inherently inaccessible to screen reader users and ambiguous to sighted users without tooltips. Using Radix UI's Tooltip component with an `asChild` trigger ensures that the button remains the interactive element while providing necessary visual and programmatic context.
**Action:** Every icon-only button must have an `aria-label` for screen readers and a `Tooltip` for visual context. Use `asChild` on the `TooltipTrigger` when wrapping existing `Button` components to maintain semantic integrity.
