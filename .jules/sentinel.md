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

## 2026-07-25 - [IP Spoofing and Credential Stuffing in Auth Rate Limiting]
**Vulnerability:** The rate limiter manually parsed `X-Forwarded-For` without validating proxies, and utilized a combined `email:${email}:ip:${ip}` key for auth rate-limiting.
**Learning:** Manual header parsing bypasses Express's secure `req.ip` trust-proxy negotiation, leading to IP spoofing. Additionally, combining email with IP in the rate-limiting key creates a credential stuffing blind spot, allowing attackers to test different emails from the same IP without hitting any limit.
**Prevention:** Always rely on `req.ip` for IP-based validation, and rate limit authentication endpoints strictly by client IP address (`ip:${ip}`) to block brute-forcing and password spraying.

## 2026-07-27 - [IP Spoofing and Auth Rate Limiter Bypass / Credential Stuffing]
**Vulnerability:** The backend rate limiter manually extracted `X-Forwarded-For` headers instead of relying on Express's secure `req.ip` setting, allowing clients to bypass rate limiting entirely by spoofing proxy headers. Furthermore, the authentication rate limiter used a composite key of `email:${email}:ip:${ip}` when email was present, enabling credential stuffing and password spraying attacks against multiple users from a single IP.
**Learning:** Manual extraction of client IPs from proxy headers bypasses the built-in, secure `trust proxy` mechanism of Express, introducing IP spoofing risks. In addition, authentication rate limiting must be strictly IP-based to ensure attackers cannot spray password attempts against different accounts from the same source.
**Prevention:** Always rely strictly on Express's secure `req.ip` to determine the client IP (which correctly honors `trust proxy` configuration) and enforce strictly IP-based keys (`ip:${ip}`) for authentication-related endpoints.

## 2026-07-31 - IP Spoofing and Password Spraying Vulnerability in Rate Limiting Middleware
**Vulnerability:** Manual parsing of the `X-Forwarded-For` header in `rate-limiter.ts` allowed clients to spoof arbitrary client IPs and completely bypass rate limits. Additionally, combining email addresses in authentication rate-limit keys enabled password spraying/credential stuffing attacks across many accounts from a single IP.
**Learning:** Direct inspection of forwarded IP headers in application code bypasses the web framework's native, secure, trust-proxy IP extraction rules, introducing a spoofing vector. Authentication rate limiting keys must target the source IP rather than per-email combinations to effectively block single-source brute force campaigns.
**Prevention:** Always rely strictly on the framework's native `req.ip` rather than manually extracting IPs from request headers, and ensure `trust proxy` configuration is securely defined on the Express server instance. Use strictly IP-based keys for authentication rate limits.

## 2026-08-10 - [Insecure Input and Size Handling in AI Proxy Endpoints]

**Vulnerability:** AI proxy endpoints `getTypingFeedback`, `getWritingFeedback`, and `getStoryResponse` accepted unvalidated bodies, allowing arbitrary payload types and unbounded string lengths.
**Learning:** Lacking validation on AI proxy endpoints creates risks of Denial of Service (DoS) via resource exhaustion, extremely high-cost external API calls, and prompt injection vectors through oversized or unexpected request structures.
**Prevention:** Enforce strict type constraints, reasonable string/array limits, and numeric bounds on all user inputs using a robust schema validation library like Zod. Enforce maximum input sizes (e.g. 1000 characters for text) before passing data to upstream LLM APIs.

## 2026-08-08 - [Unvalidated AI Proxy Inputs]
**Vulnerability:** AI proxy endpoints `getTypingFeedback`, `getWritingFeedback`, and `getStoryResponse` had no input validation or input size limits, allowing clients to send excessively large payloads or malformed data to the Gemini API, leading to potential Denial of Service (DoS), high-cost resource exhaustion, and prompt injection attacks.
**Learning:** Even though internal and client-side access is authenticated, external API wrappers must validate all input fields (e.g. enforcing max character lengths for strings and max sizes for arrays) before passing data to costly downstream AI APIs.
**Prevention:** Always define strict Zod input schemas for AI proxy endpoints to enforce data types, value boundaries, and maximum payload/string lengths.

## 2026-08-03 - Prompt Injection and DoS on AI Proxy Endpoints
**Vulnerability:** The AI proxy endpoints accepted unvalidated numeric values and unsanitized text payloads of arbitrary length from clients, introducing risks of prompt injection and Denial of Service (DoS) due to excessive API resource/cost consumption.
**Learning:** Endpoints that interface with third-party LLMs must enforce strict type constraints, ranges, and maximum input length limitations on the server side to protect backend assets and billing.
**Prevention:** Always use Zod or comparable validation middleware to strictly enforce type safety (e.g., numeric ranges for metrics) and maximum string length limits (e.g., maximum characters for user text inputs) before forwarding data to downstream AI APIs.

## 2026-08-04 - [Overly Permissive CORS Config for Vercel Subdomains]
**Vulnerability:** The CORS origin check in `apps/backend/src/index.ts` was overly permissive. It allowed wildcard suffix matching on `.vercel.app`, meaning any deployment hosted on Vercel could bypass CORS and make authenticated credential-sharing API requests.
**Learning:** Checking for `.vercel.app` using general substring inclusion/suffix checks exposes the application to origin spoofing. Anyone with a Vercel-hosted project could issue malicious requests targeting our backend APIs.
**Prevention:** Always extract and validate the specific project subdomain prefix before allowing wildcards for Vercel preview environments. Enforce strict suffix patterns matching either `-git-` preview segments or alphanumeric hashes of at least 8 characters.

## 2026-08-05 - [Lack of Input Bounds Validation in AI Controllers]
**Vulnerability:** AI proxy controllers accepted arbitrary payload shapes, unchecked text sizes, and unrestricted numbers without validation, exposing the application to prompt injection and Denial of Service (DoS)/cost exhaustion attacks.
**Learning:** Downstream AI proxy endpoints present unique security surfaces. Unchecked string lengths and out-of-bounds metrics (like abnormal WPM/accuracy values) can trigger downstream AI service failures or allow massive prompt injection payloads.
**Prevention:** Always enforce strict schema-based input boundaries (such as Zod validation) with explicit minimum/maximum constraints on numbers, string lengths, and array depths before passing user parameters to external API wrappers.

## 2026-08-06 - [Insecure Input Validation in AI Proxy Endpoints]

**Vulnerability:** The AI proxy endpoints (`/api/v1/ai/typing-feedback`, `/api/v1/ai/writing-feedback`, and `/api/v1/ai/story-response`) lacked any input validation schemas or constraints, allowing attackers to submit arbitrary types, excessively long strings/arrays, or negative/overflow numerical values.
**Learning:** Lacking validation on AI proxy endpoints exposes the backend to severe prompt injection attacks, API abuse, and Denial of Service (DoS) / high-cost resource exhaustion from the third-party AI provider.
**Prevention:** Always implement strict, schema-based Zod validation to enforce type constraints, range limits, and maximum string/array lengths on all inputs before proxying them to third-party AI APIs.

## 2026-08-07 - [Unbounded AI Input Prompt Injection and DoS]
**Vulnerability:** The backend AI routes in `apps/backend/src/controllers/ai.controller.ts` (`getTypingFeedback`, `getWritingFeedback`, and `getStoryResponse`) lacked strict input validation and length limits, exposing them to prompt injection, high-cost resource abuse, and Denial of Service (DoS) attacks via oversized payloads.
**Learning:** AI proxy endpoints that forward user inputs directly to LLM services must be strictly bounded to prevent both prompt hijacking and high-cost API utilization.
**Prevention:** Always implement rigorous type and length validation (e.g., using Zod schemas with `.max()` bounds on arrays and string lengths) on all inputs passed to AI/LLM handlers.
## 2026-08-11 - Third-Party API DoS via Connection Hanging
**Vulnerability:** External AI services (e.g., Google's Gemini API) could be slow or hang indefinitely, holding backend request sockets/connection handles open, exhausting server resources, and leading to a server-side Denial of Service (DoS) for all clients.
**Learning:** Integrations with third-party APIs must never block or wait indefinitely. A slow responder can easily saturate the event loop or socket pool of a Node.js server.
**Prevention:** Always enforce a reasonable request timeout (e.g., 10 seconds) on all outgoing fetch/http requests using an `AbortController` and `setTimeout`. Map abort errors cleanly to user-friendly `504` AppErrors rather than leaking internal details, and guarantee cleanup of timer references with `clearTimeout` in a `finally` block.
## 2026-08-13 - [AI Request Denial of Service / Timeout Resource Exhaustion]
**Vulnerability:** The backend proxy to the third-party Gemini API lacked any request timeout constraints, making the Express server susceptible to resource exhaustion (Denial of Service) if Gemini hung or experienced extreme latency.
**Learning:** Outgoing requests to critical external services must never be unbound. Unbounded requests tie up Node.js socket connections and event loop tasks, allowing external delays to degrade entire system availability.
**Prevention:** Always wrap third-party API calls in an `AbortController`-configured `fetch` with a strict timeout (such as 10 seconds), properly clearing the timeout timer and translating abort events into generic 504 Gateway Timeout responses to avoid exposing internals.
