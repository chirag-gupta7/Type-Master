## 2026-03-30 - Accessible Icon-Only Close Buttons
**Learning:** Toast and modal close buttons with icon-only children (`<X />`) lack screen-reader text by default. Adding explicit `aria-label` attributes alongside `focus-visible:ring-2` focus rings ensures keyboard navigation and screen-reader accessibility for popups and notifications.
**Action:** Always include an `aria-label` (e.g., `aria-label="Dismiss notification"`) and explicit `focus-visible` styling on icon-only interactive controls.
