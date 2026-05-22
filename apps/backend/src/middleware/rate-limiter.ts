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

const extractPrimaryForwardedIp = (value: string): string => {
  return value.split(',')[0]?.trim() || '';
};

const getRequestIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return extractPrimaryForwardedIp(forwarded);
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return extractPrimaryForwardedIp(forwarded[0] || '');
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
};

const getEmailFromBody = (req: Request): string | null => {
  const body = req.body as { email?: unknown } | undefined;
  const rawEmail = body?.email;

  if (typeof rawEmail !== 'string') {
    return null;
  }

  const normalized = rawEmail.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const getAuthRateLimitKey = (req: Request): string => {
  const email = getEmailFromBody(req);
  const ip = getRequestIp(req);

  if (email) {
    // Prevent one noisy IP from blocking all users on shared networks.
    return `email:${email}:ip:${ip}`;
  }

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
