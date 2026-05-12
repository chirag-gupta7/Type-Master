# Palette's Journal 🎨

Critical UX and accessibility learnings from working on TypeMaster.

## 2025-05-15 - [Skip to Content Link]
**Learning:** For a keyboard-heavy application like a typing master, accessibility for screen readers and keyboard users is paramount. A "Skip to content" link allows users to bypass the navigation and jump straight to the typing interface or dashboard.
**Action:** Always include a skip link in the root layout of web applications with complex navigation.

## 2026-05-12 - [Hydration and Client-Side UI]
**Learning:** In Next.js with `next-themes`, rendering components that depend on the theme (like icons or tooltips wrapping them) can cause hydration mismatches because the server doesn't know the client's theme.
**Action:** Use a `mounted` state with `useEffect` to defer rendering of theme-dependent UI until after the component has mounted on the client.
