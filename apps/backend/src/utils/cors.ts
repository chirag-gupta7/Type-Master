/**
 * CORS utility functions
 */

/**
 * Checks if a given origin is allowed under the list of allowed origins.
 * Provides highly secure, customized validation for Vercel preview subdomains.
 *
 * @param origin - The incoming Request origin header value (e.g. "https://typemaster-git-main.vercel.app")
 * @param allowedOrigins - List of allowed origins from config (e.g. ["https://typemaster.vercel.app"])
 */
export const isOriginAllowed = (origin: string, allowedOrigins: string[]): boolean => {
  if (allowedOrigins.includes('*')) return true;

  return allowedOrigins.some((allowed) => {
    if (allowed === origin) return true;

    try {
      const allowedHostname = allowed.replace(/^https?:\/\//, '').split(':')[0];
      const originHostname = origin.replace(/^https?:\/\//, '').split(':')[0];

      if (
        allowedHostname &&
        originHostname &&
        allowedHostname.endsWith('.vercel.app') &&
        originHostname.endsWith('.vercel.app')
      ) {
        const allowedPrefix = allowedHostname.substring(
          0,
          allowedHostname.length - '.vercel.app'.length
        );
        const originSubdomain = originHostname.substring(
          0,
          originHostname.length - '.vercel.app'.length
        );

        if (originHostname === allowedHostname) return true;
        if (!originSubdomain.startsWith(allowedPrefix + '-')) return false;

        const suffix = originSubdomain.substring(allowedPrefix.length + 1);
        if (!/^[a-z0-9-]+$/.test(suffix)) return false;

        // Vercel preview deploys are dynamic and contain either a git branch indicator (-git-)
        // or a system-generated alphanumeric hash (usually 8-12 characters).
        // This helps distinguish legitimate previews from custom-registered subdomains like "typemaster-evil".
        // Note: While this heuristic significantly reduces the attack surface, it does not completely
        // eliminate the risk of an attacker registering a prefix-spoofed project name (e.g. "typemaster-git-malicious") on Vercel.
        const hasGit = suffix.includes('git-') || suffix.includes('-git');
        const hasHash = /[a-z0-9]{8,}/.test(suffix);

        return hasGit || hasHash;
      }
    } catch {
      // Fallback on any parsing error
    }

    return false;
  });
};
