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

**Vulnerability:** Gemini API keys were exposed in the frontend via NEXT*PUBLIC* environment variables, allowing anyone to intercept the key and use the AI quota.
**Learning:** Even with "public" AI keys, they should be proxied through the backend to enforce authentication and rate limiting.
**Prevention:** Never use NEXT*PUBLIC* for sensitive API keys. Implement a backend proxy for all AI features.

## 2026-05-13 - [Secret Length Timing Leak in internalOnly]

**Vulnerability:** The `internalOnly` middleware leaked the length of `INTERNAL_API_SECRET` because it performed an explicit length comparison before calling `timingSafeEqual`.
**Learning:** `timingSafeEqual` requires buffers of equal length. Checking length upfront is common but introduces a timing side-channel that reveals the secret's length.
**Prevention:** Hash both the input and the secret using a fixed-length algorithm (like SHA-256) before comparison. This ensures buffers are always the same length and prevents length leakage.

## 2026-05-14 - [Insecure Generic AI Proxy Endpoints]

**Vulnerability:** Generic AI proxy endpoints `/api/v1/ai/feedback` and `/api/v1/ai/generate` allowed clients to provide their own system prompts and arbitrary queries.
**Learning:** Providing an endpoint that allows client-side control over AI system prompts or unrestricted access to the AI model using the server's API key enables prompt injection and API abuse.
**Prevention:** Always use purpose-built, server-defined AI endpoints with hardcoded system prompts and strict input validation. Avoid creating generic "catch-all" AI proxy routes.

## 2026-05-16 - Timing side-channel in internal auth

**Vulnerability:** `internalOnly` middleware compared token lengths before `crypto.timingSafeEqual`, leaking the secret's length.
**Learning:** `crypto.timingSafeEqual` requires equal-length buffers. Checking length beforehand introduces a timing leak.
**Prevention:** Hash both buffers with SHA-256 before comparison to ensure equal length and prevent length leakage.

## 2026-07-31 - IP Spoofing and Password Spraying Vulnerability in Rate Limiting Middleware
**Vulnerability:** Manual parsing of the `X-Forwarded-For` header in `rate-limiter.ts` allowed clients to spoof arbitrary client IPs and completely bypass rate limits. Additionally, combining email addresses in authentication rate-limit keys enabled password spraying/credential stuffing attacks across many accounts from a single IP.
**Learning:** Direct inspection of forwarded IP headers in application code bypasses the web framework's native, secure, trust-proxy IP extraction rules, introducing a spoofing vector. Authentication rate limiting keys must target the source IP rather than per-email combinations to effectively block single-source brute force campaigns.
**Prevention:** Always rely strictly on the framework's native `req.ip` rather than manually extracting IPs from request headers, and ensure `trust proxy` configuration is securely defined on the Express server instance. Use strictly IP-based keys for authentication rate limits.

## 2026-08-10 - [Insecure Input and Size Handling in AI Proxy Endpoints]

**Vulnerability:** AI proxy endpoints `getTypingFeedback`, `getWritingFeedback`, and `getStoryResponse` accepted unvalidated bodies, allowing arbitrary payload types and unbounded string lengths.
**Learning:** Lacking validation on AI proxy endpoints creates risks of Denial of Service (DoS) via resource exhaustion, extremely high-cost external API calls, and prompt injection vectors through oversized or unexpected request structures.
**Prevention:** Enforce strict type constraints, reasonable string/array limits, and numeric bounds on all user inputs using a robust schema validation library like Zod. Enforce maximum input sizes (e.g. 1000 characters for text) before passing data to upstream LLM APIs.
