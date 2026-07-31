import type { Request } from 'express';
import { getRequestIp, getAuthRateLimitKey } from './rate-limiter';

describe('rate-limiter helpers', () => {
  describe('getRequestIp', () => {
    it('should return req.ip when present', () => {
      const mockReq = {
        ip: '192.168.1.50',
      } as unknown as Request;

      expect(getRequestIp(mockReq)).toBe('192.168.1.50');
    });

    it('should return "unknown" when req.ip is undefined', () => {
      const mockReq = {
        ip: undefined,
      } as unknown as Request;

      expect(getRequestIp(mockReq)).toBe('unknown');
    });
  });

  describe('getAuthRateLimitKey', () => {
    it('should return ip-based key when email is not present', () => {
      const mockReq = {
        ip: '10.0.0.1',
        body: {},
      } as unknown as Request;

      expect(getAuthRateLimitKey(mockReq)).toBe('ip:10.0.0.1');
    });

    it('should return ip-based key even if email is present in body', () => {
      const mockReq = {
        ip: '10.0.0.1',
        body: {
          email: 'target@example.com',
        },
      } as unknown as Request;

      // Ensure that authentication rate limit key is strictly IP-based to prevent password spraying
      expect(getAuthRateLimitKey(mockReq)).toBe('ip:10.0.0.1');
    });

    it('should handle undefined ip correctly', () => {
      const mockReq = {
        ip: undefined,
        body: {
          email: 'user@example.com',
        },
      } as unknown as Request;

      expect(getAuthRateLimitKey(mockReq)).toBe('ip:unknown');
    });
  });
});
