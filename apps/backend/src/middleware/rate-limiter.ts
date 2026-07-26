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

// Security enhancement: Rely strictly on Express's secure, built-in req.ip to prevent IP spoofing
export const getRequestIp = (req: Request): string => {
  return req.ip || 'unknown';
};

// Security enhancement: Use strictly IP-based rate limiting keys to prevent password spraying attacks
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
