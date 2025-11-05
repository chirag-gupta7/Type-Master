const CACHE_PREFIX = 'typemaster:cache:';
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutes

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const isSessionStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storage = window.sessionStorage;
    const testKey = `${CACHE_PREFIX}__test__`;
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('Session storage is not available, caching disabled.', error);
    return false;
  }
};

const canUseStorage = isSessionStorageAvailable();

const storage = canUseStorage ? window.sessionStorage : null;

/**
 * Build a storage key scoped for the cache utility.
 */
const buildKey = (key: string): string => `${CACHE_PREFIX}${key}`;

/**
 * Save a value in sessionStorage cache.
 */
export const setCache = <T>(key: string, value: T, ttl: number = DEFAULT_TTL): void => {
  if (!canUseStorage || !storage) return;

  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttl,
  };

  try {
    storage.setItem(buildKey(key), JSON.stringify(entry));
  } catch (error) {
    console.warn(`Failed to store cache entry for key "${key}"`, error);
  }
};

/**
 * Retrieve a cached value if it exists and is not expired.
 */
export const getCache = <T>(key: string): T | null => {
  if (!canUseStorage || !storage) return null;

  try {
    const raw = storage.getItem(buildKey(key));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T> | null;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      storage.removeItem(buildKey(key));
      return null;
    }

    return entry.value;
  } catch (error) {
    console.warn(`Failed to read cache entry for key "${key}"`, error);
    storage?.removeItem(buildKey(key));
    return null;
  }
};

/**
 * Remove a cached value.
 */
export const invalidateCache = (key: string): void => {
  if (!canUseStorage || !storage) return;
  storage.removeItem(buildKey(key));
};

/**
 * Clear every cached value created by this utility.
 */
export const clearCache = (): void => {
  if (!canUseStorage || !storage) return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
};

export type CacheOptions = {
  key: string;
  ttl?: number;
  skip?: boolean;
};

export { DEFAULT_TTL as DEFAULT_CACHE_TTL };
