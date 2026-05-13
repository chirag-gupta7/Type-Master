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
## 2026-05-13 - Client-side AI Key Exposure
**Vulnerability:** Gemini API keys were exposed in the frontend via NEXT_PUBLIC_ environment variables, allowing anyone to intercept the key and use the AI quota.
**Learning:** Even with "public" AI keys, they should be proxied through the backend to enforce authentication and rate limiting.
**Prevention:** Never use NEXT_PUBLIC_ for sensitive API keys. Implement a backend proxy for all AI features.

## 2026-05-13 - [Secret Length Timing Leak in internalOnly]
**Vulnerability:** The `internalOnly` middleware leaked the length of `INTERNAL_API_SECRET` because it performed an explicit length comparison before calling `timingSafeEqual`.
**Learning:** `timingSafeEqual` requires buffers of equal length. Checking length upfront is common but introduces a timing side-channel that reveals the secret's length.
**Prevention:** Hash both the input and the secret using a fixed-length algorithm (like SHA-256) before comparison. This ensures buffers are always the same length and prevents length leakage.

## 2026-05-13 - [Insecure Generic AI Proxy]
**Vulnerability:** Generic AI endpoints allowed clients to provide their own `systemPrompt`, enabling easy prompt injection and potential resource abuse.
**Learning:** Proxies should have hardcoded, server-side defined system prompts and only accept specific data parameters from the client.
**Prevention:** Avoid generic "pass-through" AI endpoints. Implement specific, purpose-built endpoints with strict schema validation for AI features.
