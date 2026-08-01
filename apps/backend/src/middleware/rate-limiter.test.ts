import { Request } from 'express';
import { getRequestIp, getAuthRateLimitKey } from './rate-limiter';

describe('rate-limiter helpers', () => {
  describe('getRequestIp', () => {
    it('should return req.ip if present', () => {
      const mockReq = {
        ip: '127.0.0.1',
      } as Partial<Request>;

      const ip = getRequestIp(mockReq as Request);
      expect(ip).toBe('127.0.0.1');
    });

    it('should return unknown if req.ip is not present', () => {
      const mockReq = {} as Partial<Request>;

      const ip = getRequestIp(mockReq as Request);
      expect(ip).toBe('unknown');
    });
  });

  describe('getAuthRateLimitKey', () => {
    it('should return strictly IP-based rate limit key using the request IP', () => {
      const mockReq = {
        ip: '203.0.113.195',
        body: {
          email: 'test@example.com',
        },
      } as Partial<Request>;

      const key = getAuthRateLimitKey(mockReq as Request);
      expect(key).toBe('ip:203.0.113.195');
    });

    it('should return default key if request IP is unknown', () => {
      const mockReq = {} as Partial<Request>;

      const key = getAuthRateLimitKey(mockReq as Request);
      expect(key).toBe('ip:unknown');
    });
  });
});
