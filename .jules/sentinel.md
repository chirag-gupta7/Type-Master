# Sentinel's Journal - Critical Security Learnings

## 2025-05-11 - [Client-side AI Key Exposure]
**Vulnerability:** `NEXT_PUBLIC_GEMINI_API_KEY` was exposed in the frontend and used for direct client-side calls to Google's Gemini API.
**Learning:** Any environment variable prefixed with `NEXT_PUBLIC_` in Next.js is bundled into the client-side code and is visible to anyone. Direct API calls from the client also leak the API key in the request URL or headers.
**Prevention:** Sensitive API keys must only be stored on the server (backend). Interaction with third-party AI services should be proxied through the backend, where authentication and rate limiting can be enforced.

## 2026-05-10 - Auth Bypass in /auth/token endpoint
**Vulnerability:** Any user could obtain a backend JWT for any email address by calling /api/v1/auth/token with just an email payload.
**Learning:** This endpoint was designed for NextAuth to provision tokens for OAuth users but lacked any authentication itself.
**Prevention:** Always secure server-to-server endpoints with a shared secret or mutual TLS, even if they are only intended for internal use.

## 2026-05-11 - Unauthenticated Token Provisioning (Refined)
**Vulnerability:** The `/api/v1/auth/token` endpoint allowed any client to request a valid backend JWT by providing only an email address.
**Learning:** Bridging NextAuth with a backend requires a shared secret (`INTERNAL_API_SECRET`) to prevent unauthorized token provisioning.
**Prevention:** Secure internal endpoints using a shared secret and verify it using timing-safe comparisons (`crypto.timingSafeEqual`).
