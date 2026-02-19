# Modern Typing Test Implementation

## Primary Route

- `/dashboard`

## Primary Component

- `apps/frontend/src/components/TypingTest.tsx`

## Capabilities

- configurable durations (`30`, `60`, `180`)
- live WPM/accuracy updates
- end-of-test results
- persistence to backend via `/api/v1/tests`

## Current Limitation

- AI feedback currently calls Gemini directly from client using `NEXT_PUBLIC_GEMINI_API_KEY`.
- Move this to a backend proxy to avoid key exposure.
