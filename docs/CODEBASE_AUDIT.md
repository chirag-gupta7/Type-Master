# Codebase Audit (Errors, Loopholes, Risks)

Date: 2026-02-19

## Fixed in This Pass

### 1) Insecure token fallback (Critical)

Issue:

- backend auth middleware previously accepted base64-decoded JSON payloads when JWT verification failed.

Impact:

- potential auth bypass by crafting unsigned tokens.

Fix:

- removed base64 fallback in `apps/backend/src/middleware/auth.middleware.ts`.
- backend now requires valid signed JWT.

### 2) Cross-user access in assessment/mistake flows (High)

Issue:

- controllers used user IDs from request body/params without strict ownership checks.

Impact:

- authenticated user could target another user’s assessment/mistake data.

Fix:

- assessment routes now require auth.
- controllers enforce authenticated user ID scope checks.
- applied in:
  - `apps/backend/src/controllers/assessment.controller.ts`
  - `apps/backend/src/controllers/mistake.controller.ts`
  - `apps/backend/src/routes/assessment.routes.ts`

## Detected and Still Open

### A) Build safety bypass in frontend config (High)

- `apps/frontend/next.config.js` has:
  - `eslint.ignoreDuringBuilds = true`
  - `typescript.ignoreBuildErrors = true`

Risk: production deploys can ship with lint/type regressions.

### B) Client-side AI key exposure risk (High)

- `NEXT_PUBLIC_GEMINI_API_KEY` is consumed directly in client components:
  - `TypingTest.tsx`
  - `games/PromptDash.tsx`
  - `games/StoryChain.tsx`

Risk: public API key exposure and abuse.

Recommendation: move Gemini calls behind backend proxy endpoints and keep server-side key only.

### C) Prisma schema tooling warning (Medium)

- diagnostics report: datasource `url` deprecation warning for upcoming Prisma config changes.

Recommendation: plan migration to `prisma.config.ts` / Prisma 7 style config before upgrade.

### D) Excessive production debug logging (Medium)

- extensive `console.log` statements in frontend auth/API/learn flows.

Risk: noisy logs, potential sensitive metadata leakage, harder incident triage.

Recommendation: gate logs behind development flag or centralized logger.

### E) API/client mismatch marker (Low)

- `testAPI.getTest()` includes comment that backend endpoint does not exist and uses local fallback text generation.

Recommendation: either implement backend endpoint or remove comment/fallback ambiguity.

## Suggested Next Hardening Sprint

1. Remove build bypass flags in frontend config.
2. Move AI integrations server-side; rotate exposed keys.
3. Strip debug logs from production paths.
4. Add ownership checks to any remaining `:userId` route patterns.
5. Add CI gate for `typecheck + lint + tests`.
