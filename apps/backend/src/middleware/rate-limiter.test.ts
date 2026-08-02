import { Request } from 'express';
import { getRequestIp, getAuthRateLimitKey } from './rate-limiter';

describe('rate-limiter middleware helpers', () => {
  describe('getRequestIp', () => {
    it('should return req.ip if present', () => {
      const mockReq = {
        ip: '192.168.1.1',
      } as unknown as Request;

      expect(getRequestIp(mockReq)).toBe('192.168.1.1');
    });

    it('should return "unknown" if req.ip is not present', () => {
      const mockReq = {} as unknown as Request;

      expect(getRequestIp(mockReq)).toBe('unknown');
    });
  });

  describe('getAuthRateLimitKey', () => {
    it('should return ip-based key when request body has no email', () => {
      const mockReq = {
        ip: '192.168.1.1',
        body: {},
      } as unknown as Request;

      expect(getAuthRateLimitKey(mockReq)).toBe('ip:192.168.1.1');
    });

    it('should return ip-based key even if request body contains an email', () => {
      const mockReq = {
        ip: '192.168.1.1',
        body: {
          email: 'test@example.com',
        },
      } as unknown as Request;

      expect(getAuthRateLimitKey(mockReq)).toBe('ip:192.168.1.1');
    });

    it('should return unknown key if request has no ip and no body', () => {
      const mockReq = {} as unknown as Request;

      expect(getAuthRateLimitKey(mockReq)).toBe('ip:unknown');
    });
  });
});
