import { Request } from 'express';
import { getRequestIp, getAuthRateLimitKey } from './rate-limiter';

describe('Rate Limiter Helpers', () => {
  describe('getRequestIp', () => {
    it('should return req.ip if present', () => {
      const req = {
        ip: '192.168.1.1',
      } as unknown as Request;

      expect(getRequestIp(req)).toBe('192.168.1.1');
    });

    it('should return unknown if req.ip is not present', () => {
      const req = {} as unknown as Request;

      expect(getRequestIp(req)).toBe('unknown');
    });

    it('should ignore x-forwarded-for headers directly (relying on Express trust proxy settings)', () => {
      const req = {
        ip: '192.168.1.1',
        headers: {
          'x-forwarded-for': '10.0.0.1',
        },
      } as unknown as Request;

      // Even if x-forwarded-for is set in the headers, getRequestIp should only return req.ip.
      // This is because Express trust proxy handles parsing this header securely.
      expect(getRequestIp(req)).toBe('192.168.1.1');
    });
  });

  describe('getAuthRateLimitKey', () => {
    it('should return strictly IP-based keys to prevent password spraying', () => {
      const req = {
        ip: '192.168.1.1',
        body: {
          email: 'test@example.com',
        },
      } as unknown as Request;

      // Regardless of the email in the request body, the rate limit key must be strictly IP-based.
      expect(getAuthRateLimitKey(req)).toBe('ip:192.168.1.1');
    });

    it('should return ip:unknown if no IP is available', () => {
      const req = {
        body: {
          email: 'test@example.com',
        },
      } as unknown as Request;

      expect(getAuthRateLimitKey(req)).toBe('ip:unknown');
    });
  });
});
