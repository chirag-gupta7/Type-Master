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
 * Extracts client IP securely using Express's trusted req.ip property.
 * This respects the application's 'trust proxy' configuration,
 * preventing IP spoofing via attacker-controlled headers.
 */
export const getRequestIp = (req: Request): string => {
  return req.ip || 'unknown';
};

/**
 * Returns a strictly IP-based rate limit key to block password spraying
 * and credential stuffing attacks targeting different email addresses from a single IP.
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
