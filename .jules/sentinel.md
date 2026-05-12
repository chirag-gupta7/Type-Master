## 2026-05-10 - Auth Bypass in /auth/token endpoint
**Vulnerability:** Any user could obtain a backend JWT for any email address by calling /api/v1/auth/token with just an email payload.
**Learning:** This endpoint was designed for NextAuth to provision tokens for OAuth users but lacked any authentication itself.
**Prevention:** Always secure server-to-server endpoints with a shared secret or mutual TLS, even if they are only intended for internal use.

## 2026-05-12 - Client-side AI Key Exposure
**Vulnerability:** Gemini API keys were exposed in the frontend via NEXT_PUBLIC_ environment variables, allowing anyone to intercept the key and use the AI quota.
**Learning:** Even with "public" AI keys, they should be proxied through the backend to enforce authentication and rate limiting.
**Prevention:** Never use NEXT_PUBLIC_ for sensitive API keys. Implement a backend proxy for all AI features.
