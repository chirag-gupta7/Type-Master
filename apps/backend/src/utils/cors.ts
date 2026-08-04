/**
 * Helper to determine if a CORS origin is allowed.
 * Prevents wildcard bypasses and ensures secure validation of Vercel preview deployment URLs.
 */
export const isOriginAllowed = (origin: string, allowedOrigins: string[]): boolean => {
  if (allowedOrigins.includes('*')) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.hostname;
    const originProto = originUrl.protocol; // e.g., 'https:'

    if (!originHost.endsWith('.vercel.app')) {
      return false;
    }

    for (const allowed of allowedOrigins) {
      if (!allowed.startsWith('http://') && !allowed.startsWith('https://')) {
        continue;
      }

      const allowedUrl = new URL(allowed);
      const allowedHost = allowedUrl.hostname;
      const allowedProto = allowedUrl.protocol;

      // Protocol must match
      if (originProto !== allowedProto) {
        continue;
      }

      if (!allowedHost.endsWith('.vercel.app')) {
        continue;
      }

      const prefix = allowedHost.substring(0, allowedHost.length - '.vercel.app'.length);
      if (!prefix) {
        continue;
      }

      // The origin hostname must start with the allowed prefix + '-'
      if (!originHost.startsWith(`${prefix}-`)) {
        continue;
      }

      const suffix = originHost.substring(prefix.length + 1, originHost.length - '.vercel.app'.length);

      // Verify suffix has '-git-' or starts with 'git-' or is an alphanumeric hash of at least 8 characters
      const hasGit = suffix.includes('-git-') || suffix.startsWith('git-');
      const isAlphanumericHash = /^[a-zA-Z0-9]{8,}$/.test(suffix);

      if (hasGit || isAlphanumericHash) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
};
