const DEFAULT_API_BASE_URL = 'https://typemaster-backend-pfns.onrender.com';

/**
 * Resolve the backend API base URL consistently across client/server contexts.
 * Prefers explicit env configuration and falls back to the deployed backend.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;
  return DEFAULT_API_BASE_URL;
};

export const API_VERSION = 'v1';
