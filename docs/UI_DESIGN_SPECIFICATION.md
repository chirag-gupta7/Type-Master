# UI Design Specification (Current)

This captures what is currently implemented, not aspirational design.

## App-Level UI

- Persistent top navigation with desktop/mobile variants
- Theme support via `next-themes`
- Global provider stack in app layout

## Main UX Surfaces

- Landing hero + feature cards (`/`)
- Typing test dashboard (`/dashboard`)
- Lesson cards and section flows (`/learn`)
- Game views (`/games`)
- Progress and achievements dashboards (`/progress`, `/achievements`)

## Current Quality Observations

- There are extensive client-side debug logs in production paths.
- Some pages still use transitional/demo patterns.

See `CODEBASE_AUDIT.md` for details.
