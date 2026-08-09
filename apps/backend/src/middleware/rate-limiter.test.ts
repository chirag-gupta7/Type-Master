import { Request } from 'express';
import { getRequestIp, getAuthRateLimitKey } from './rate-limiter';

describe('Rate Limiting Middleware Helpers', () => {
  describe('getRequestIp', () => {
    it('should return req.ip when defined', () => {
      const req = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request;

      expect(getRequestIp(req)).toBe('192.168.1.1');
    });

    it('should fallback to remoteAddress if req.ip is undefined', () => {
      const req = {
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request;

      expect(getRequestIp(req)).toBe('10.0.0.1');
    });

    it('should fallback to unknown if both req.ip and remoteAddress are undefined', () => {
      const req = {
        socket: {},
      } as unknown as Request;

      expect(getRequestIp(req)).toBe('unknown');
    });
  });

  describe('getAuthRateLimitKey', () => {
    it('should generate a strictly IP-based key with prefix', () => {
      const req = {
        ip: '192.168.1.2',
        body: { email: 'target@example.com' },
      } as unknown as Request;

      expect(getAuthRateLimitKey(req)).toBe('ip:192.168.1.2');
    });

    it('should not include email payload in key to prevent credential stuffing rate-limiting bypass', () => {
      const req = {
        ip: '192.168.1.2',
        body: { email: 'another-email@example.com' },
      } as unknown as Request;

      expect(getAuthRateLimitKey(req)).toBe('ip:192.168.1.2');
    });

    it('should produce identical keys for different emails from the same IP (blocks credential stuffing)', () => {
      const req1 = {
        ip: '203.0.113.50',
        body: { email: 'victim1@example.com' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const req2 = {
        ip: '203.0.113.50',
        body: { email: 'victim2@example.com' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const key1 = getAuthRateLimitKey(req1);
      const key2 = getAuthRateLimitKey(req2);

      expect(key1).toBe('ip:203.0.113.50');
      expect(key2).toBe('ip:203.0.113.50');
      expect(key1).toBe(key2);
    });
  });
});
