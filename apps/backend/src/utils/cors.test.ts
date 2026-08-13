import { isOriginAllowed } from './cors';

describe('isOriginAllowed', () => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://typemaster.vercel.app',
    'https://admin-panel.vercel.app',
  ];

  it('should allow exact matches from allowedOrigins', () => {
    expect(isOriginAllowed('http://localhost:3000', allowedOrigins)).toBe(true);
    expect(isOriginAllowed('https://typemaster.vercel.app', allowedOrigins)).toBe(true);
  });

  it('should deny origins that do not match allowedOrigins', () => {
    expect(isOriginAllowed('http://localhost:4000', allowedOrigins)).toBe(false);
    expect(isOriginAllowed('https://google.com', allowedOrigins)).toBe(false);
  });

  it('should allow wildcard matching if "*" is in allowedOrigins', () => {
    expect(isOriginAllowed('https://google.com', ['*'])).toBe(true);
  });

  it('should allow valid Vercel preview deployments with matching prefix and git branch naming', () => {
    // typemaster prefix with -git- suffix
    expect(
      isOriginAllowed('https://typemaster-git-feature-branch-user.vercel.app', allowedOrigins)
    ).toBe(true);
    expect(
      isOriginAllowed('https://typemaster-git-main.vercel.app', allowedOrigins)
    ).toBe(true);
  });

  it('should allow valid Vercel preview deployments with matching prefix and 8+ char alphanumeric hash', () => {
    // typemaster prefix with 8+ char alphanumeric hash suffix
    expect(isOriginAllowed('https://typemaster-a1b2c3d4.vercel.app', allowedOrigins)).toBe(true);
    expect(
      isOriginAllowed('https://typemaster-abcdef123456.vercel.app', allowedOrigins)
    ).toBe(true);
  });

  it('should deny Vercel preview deployments with matching prefix but invalid/short suffix', () => {
    // Suffix too short (7 characters)
    expect(isOriginAllowed('https://typemaster-abcdef1.vercel.app', allowedOrigins)).toBe(false);
    // Suffix has special characters but doesn't contain -git-
    expect(isOriginAllowed('https://typemaster-abc_def1.vercel.app', allowedOrigins)).toBe(false);
  });

  it('should deny Vercel preview deployments with mismatching prefix', () => {
    expect(
      isOriginAllowed('https://malicious-git-main.vercel.app', allowedOrigins)
    ).toBe(false);
    expect(
      isOriginAllowed('https://attacker-a1b2c3d4.vercel.app', allowedOrigins)
    ).toBe(false);
  });

  it('should deny subdomains that spoof the prefix name elsewhere in the host', () => {
    expect(
      isOriginAllowed('https://attacker-typemaster-git-main.vercel.app', allowedOrigins)
    ).toBe(false);
    expect(
      isOriginAllowed('https://typemaster.attacker.vercel.app', allowedOrigins)
    ).toBe(false);
  });

  it('should deny non-Vercel subdomains', () => {
    expect(
      isOriginAllowed('https://typemaster-git-main.attacker.com', allowedOrigins)
    ).toBe(false);
  });

  it('should gracefully return false for malformed or empty origins', () => {
    expect(isOriginAllowed('', allowedOrigins)).toBe(false);
    expect(isOriginAllowed('not-a-url', allowedOrigins)).toBe(false);
  });

  it('should verify protocol matches', () => {
    // http instead of https for typemaster
    expect(
      isOriginAllowed('http://typemaster-git-main.vercel.app', allowedOrigins)
    ).toBe(false);
  });
});
