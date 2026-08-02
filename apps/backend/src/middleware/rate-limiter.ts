import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_GLOBAL_MAX_REQUESTS = 1000;
const DEFAULT_AUTH_MAX_REQUESTS = 30;
const DEFAULT_INTERNAL_AUTH_MAX_REQUESTS = 300;

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

/**
 * Securely extracts the request IP.
 * Relying on Express's secure, built-in `req.ip` is highly secure because Express honors
 * 'trust proxy' settings which validate proxy headers against a list of trusted upstream proxies,
 * thereby preventing malicious clients from spoofing their IP address via custom X-Forwarded-For headers.
 */
export const getRequestIp = (req: Request): string => {
  return req.ip || 'unknown';
};

/**
 * Generates a rate limit key for authentication attempts.
 * Using strictly IP-based keys (ip:${ip}) prevents credential stuffing and password spraying
 * attacks from a single source, as all attempts (even with different emails) from that IP are bound
 * to the same limit window.
 */
export const getAuthRateLimitKey = (req: Request): string => {
  const ip = getRequestIp(req);
  return `ip:${ip}`;
};

export const rateLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  max: parsePositiveInt(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_GLOBAL_MAX_REQUESTS),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getRequestIp(req),
});

export const authLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, DEFAULT_AUTH_MAX_REQUESTS),
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => getAuthRateLimitKey(req),
});

export const internalAuthLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.INTERNAL_AUTH_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  max: parsePositiveInt(
    process.env.INTERNAL_AUTH_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_INTERNAL_AUTH_MAX_REQUESTS
  ),
  message: 'Too many internal authentication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getAuthRateLimitKey(req),
});
