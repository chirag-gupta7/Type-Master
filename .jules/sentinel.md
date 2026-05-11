## 2026-05-11 - Unauthenticated Token Provisioning
**Vulnerability:** The `/api/v1/auth/token` endpoint allowed any client to request a valid backend JWT by providing only an email address, with no verification of the caller's identity.
**Learning:** This endpoint was designed to bridge NextAuth (frontend) with the backend, but it lacked a shared secret to ensure only the frontend could call it.
**Prevention:** Secure server-to-server endpoints using a shared secret (e.g., `INTERNAL_API_SECRET`) and verify it using timing-safe comparisons.
