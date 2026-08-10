import { isOriginAllowed } from './cors';

describe('CORS Origin Validation', () => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://typemaster.vercel.app',
    'https://typemaster-web.vercel.app',
  ];

  it('should allow exact match for standard origins', () => {
    expect(isOriginAllowed('http://localhost:3000', allowedOrigins)).toBe(true);
    expect(isOriginAllowed('https://typemaster.vercel.app', allowedOrigins)).toBe(true);
    expect(isOriginAllowed('https://typemaster-web.vercel.app', allowedOrigins)).toBe(true);
  });

  it('should deny arbitrary unmatched origins', () => {
    expect(isOriginAllowed('https://google.com', allowedOrigins)).toBe(false);
    expect(isOriginAllowed('http://localhost:5000', allowedOrigins)).toBe(false);
  });

  it('should allow any origin if wildcard * is configured', () => {
    expect(isOriginAllowed('https://attacker.vercel.app', ['*'])).toBe(true);
  });

  it('should allow valid Vercel preview/branch deployments for configured Vercel domains', () => {
    // Branch preview deploy
    expect(
      isOriginAllowed('https://typemaster-git-feature-login.vercel.app', allowedOrigins)
    ).toBe(true);
    // Hash preview deploy
    expect(
      isOriginAllowed('https://typemaster-a1b2c3d4e-myorg.vercel.app', allowedOrigins)
    ).toBe(true);
    // Prefix match for typemaster-web
    expect(
      isOriginAllowed('https://typemaster-web-git-main.vercel.app', allowedOrigins)
    ).toBe(true);
  });

  it('should reject non-Vercel domains even if they attempt prefix spoofing', () => {
    expect(
      isOriginAllowed('https://typemaster-git-feature.other.com', allowedOrigins)
    ).toBe(false);
  });

  it('should reject other user-registered Vercel subdomains (e.g. attacker.vercel.app)', () => {
    expect(isOriginAllowed('https://attacker.vercel.app', allowedOrigins)).toBe(false);
  });

  it('should reject suspicious Vercel subdomains targeting prefix spoofing (e.g. typemaster-evil)', () => {
    // "evil" is not a standard git branch or hash format (less than 8 alphanumeric characters and no "-git-")
    expect(isOriginAllowed('https://typemaster-evil.vercel.app', allowedOrigins)).toBe(false);
    expect(isOriginAllowed('https://typemaster-hacker.vercel.app', allowedOrigins)).toBe(false);
  });

  it('should reject subdomains containing invalid or malicious characters', () => {
    expect(
      isOriginAllowed('https://typemaster-git_branch.vercel.app', allowedOrigins)
    ).toBe(false);
    expect(
      isOriginAllowed('https://typemaster-git$branch.vercel.app', allowedOrigins)
    ).toBe(false);
  });

  it('should handle malformed URLs gracefully and return false', () => {
    expect(isOriginAllowed('not-a-url', allowedOrigins)).toBe(false);
    expect(isOriginAllowed('https://', allowedOrigins)).toBe(false);
  });
});
