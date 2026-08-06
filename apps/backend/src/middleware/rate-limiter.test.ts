import { Request } from 'express';
import { getRequestIp, getAuthRateLimitKey } from './rate-limiter';

describe('Rate Limiter Helper Functions', () => {
  it('should extract correct IP using getRequestIp when req.ip is set', () => {
    const mockReq = {
      ip: '192.168.1.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as any as Request;

    const ip = getRequestIp(mockReq);
    expect(ip).toBe('192.168.1.1');
  });

  it('should use strictly IP-based keys in getAuthRateLimitKey to prevent credential stuffing', () => {
    const mockReq1 = {
      ip: '203.0.113.50',
      body: { email: 'victim1@example.com' },
      socket: { remoteAddress: '127.0.0.1' },
    } as any as Request;

    const mockReq2 = {
      ip: '203.0.113.50',
      body: { email: 'victim2@example.com' },
      socket: { remoteAddress: '127.0.0.1' },
    } as any as Request;

    const key1 = getAuthRateLimitKey(mockReq1);
    const key2 = getAuthRateLimitKey(mockReq2);

    // Both keys must be identical (based on the IP address) to ensure IP-based rate limiting
    expect(key1).toBe('ip:203.0.113.50');
    expect(key2).toBe('ip:203.0.113.50');
    expect(key1).toBe(key2);
  });

  it('should fall back to socket remote address if req.ip is not populated', () => {
    const mockReq = {
      socket: { remoteAddress: '10.0.0.5' },
    } as any as Request;

    const ip = getRequestIp(mockReq);
    expect(ip).toBe('10.0.0.5');
  });

  it('should fall back to unknown if both req.ip and remoteAddress are missing', () => {
    const mockReq = {
      socket: {},
    } as any as Request;

    const ip = getRequestIp(mockReq);
    expect(ip).toBe('unknown');
  });
});
