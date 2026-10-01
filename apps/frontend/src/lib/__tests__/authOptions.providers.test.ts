/**
 * Regression: email/password sign-in must not depend on Google OAuth.
 *
 * `authOptions.ts` used to `throw` at module load when GOOGLE_CLIENT_ID /
 * GOOGLE_CLIENT_SECRET were absent. Because the NextAuth route handler imports
 * this module, that throw 500'd *every* auth request, so `signIn('credentials')`
 * could never work on a deployment without Google configured.
 */

import { PrismaAdapter } from '@next-auth/prisma-adapter';

const mockPrismaAdapter = PrismaAdapter as unknown as jest.Mock;

const findUniqueMock = jest.fn();
const findFirstMock = jest.fn();
const compareMock = jest.fn();

jest.mock('@/lib/auth/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}));

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({ __adapter: true })),
}));

jest.mock('bcryptjs', () => ({
  compare: (...args: unknown[]) => compareMock(...args),
}));

const ENV_KEYS = ['NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] as const;

const loadAuthOptions = () => {
  let mod: typeof import('@/lib/auth/authOptions');
  jest.isolateModules(() => {
    mod = require('@/lib/auth/authOptions');
  });
  return mod!;
};

// Assert on `id`, not `type`: GoogleProvider registers as type 'oauth'.
const providerIds = (providers: unknown): string[] =>
  (providers as { id: string }[]).map((p) => p.id);

const getCredentialsAuthorize = (options: {
  providers: unknown;
}): ((c: Record<string, string>) => Promise<unknown>) => {
  const provider = (
    options.providers as { id: string; options?: { authorize?: unknown } }[]
  ).find((p) => p.id === 'credentials');
  return provider!.options!.authorize as (c: Record<string, string>) => Promise<unknown>;
};

describe('authOptions provider registration', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  });

  afterAll(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
  });

  it('loads and exposes the credentials provider when Google is NOT configured', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    // The bug: this threw "Google OAuth credentials are not configured."
    let options: ReturnType<typeof loadAuthOptions>['authOptions'] | undefined;
    expect(() => {
      options = loadAuthOptions().authOptions;
    }).not.toThrow();

    const ids = providerIds(options!.providers);
    expect(ids).toContain('credentials');
    expect(ids).not.toContain('google');
  });

  it('registers google alongside credentials when both are configured', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';

    const { authOptions, isGoogleAuthEnabled } = loadAuthOptions();
    const ids = providerIds(authOptions.providers);

    expect(ids).toContain('google');
    expect(ids).toContain('credentials');
    expect(isGoogleAuthEnabled).toBe(true);
  });

  it('reports google as disabled when only one half of its config is present', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-id';
    delete process.env.GOOGLE_CLIENT_SECRET;

    const { authOptions, isGoogleAuthEnabled } = loadAuthOptions();

    expect(isGoogleAuthEnabled).toBe(false);
    expect(providerIds(authOptions.providers)).not.toContain('google');
  });

  it('still throws when NEXTAUTH_SECRET is missing', () => {
    delete process.env.NEXTAUTH_SECRET;

    expect(() => loadAuthOptions()).toThrow(/NEXTAUTH_SECRET/);
  });
});

describe('credentials authorize email handling', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    process.env.NEXTAUTH_SECRET = 'test-secret';
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  afterAll(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    compareMock.mockResolvedValue(true);
    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashed',
    });
    findFirstMock.mockResolvedValue(null);
  });

  it('normalizes mixed-case and padded email before the DB lookup', async () => {
    const { authOptions } = loadAuthOptions();
    const authorize = getCredentialsAuthorize(authOptions);

    const user = (await authorize({ email: '  TeSt@ExAmPlE.CoM ', password: 'Password1' })) as {
      id: string;
    };

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(user.id).toBe('user-1');
  });

  it('rejects an unknown email without throwing an unhandled error', async () => {
    findUniqueMock.mockResolvedValue(null);
    const { authOptions } = loadAuthOptions();
    const authorize = getCredentialsAuthorize(authOptions);

    await expect(authorize({ email: 'nobody@example.com', password: 'Password1' })).rejects.toThrow(
      /Invalid email or password/
    );
  });

  it('rejects a wrong password', async () => {
    compareMock.mockResolvedValue(false);
    const { authOptions } = loadAuthOptions();
    const authorize = getCredentialsAuthorize(authOptions);

    await expect(authorize({ email: 'test@example.com', password: 'nope' })).rejects.toThrow(
      /Invalid email or password/
    );
  });

  it('requires both email and password', async () => {
    const { authOptions } = loadAuthOptions();
    const authorize = getCredentialsAuthorize(authOptions);

    await expect(authorize({ email: 'test@example.com' })).rejects.toThrow(
      /Email and password are required/
    );
  });

  it('authenticates a legacy row stored with uppercase email', async () => {
    // Regression guard: exact findUnique misses `Legacy.User@Example.COM`, so
    // without the insensitive fallback this user is locked out.
    findUniqueMock.mockResolvedValue(null);
    findFirstMock.mockResolvedValue({
      id: 'user-legacy',
      email: 'Legacy.User@Example.COM',
      username: 'legacyuser',
      password: 'hashed',
    });

    const { authOptions } = loadAuthOptions();
    const authorize = getCredentialsAuthorize(authOptions);
    const user = (await authorize({ email: 'legacy.user@example.com', password: 'P1' })) as {
      id: string;
    };

    expect(user.id).toBe('user-legacy');
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { email: { equals: 'legacy.user@example.com', mode: 'insensitive' } },
    });
  });

  it('does not run the case-insensitive query when the exact lookup hits', async () => {
    const { authOptions } = loadAuthOptions();
    const authorize = getCredentialsAuthorize(authOptions);
    await authorize({ email: 'test@example.com', password: 'P1' });

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(findFirstMock).not.toHaveBeenCalled();
  });
});

describe('adapter email normalization', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    process.env.NEXTAUTH_SECRET = 'test-secret';
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  afterAll(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  const getAdapter = (options: { adapter?: unknown }) =>
    options.adapter as {
      createUser: (d: { email: string }) => Promise<unknown>;
      getUserByEmail: (e: string) => Promise<unknown>;
    };

  it('lowercases the email the adapter persists on OAuth sign-up', async () => {
    // Without this, an OAuth row keeps the provider's casing and the backend's
    // normalized lookup can never match it.
    const captured: { email: string }[] = [];
    mockPrismaAdapter.mockReturnValueOnce({
      createUser: (d: { email: string }) => {
        captured.push(d);
        return Promise.resolve({ id: 'u1', email: d.email });
      },
      getUserByEmail: () => Promise.resolve(null),
    });

    const { authOptions } = loadAuthOptions();
    await getAdapter(authOptions).createUser({ email: 'Person@Example.COM' });

    expect(captured[0].email).toBe('person@example.com');
  });

  it('lowercases the email the adapter looks up', async () => {
    const seen: string[] = [];
    mockPrismaAdapter.mockReturnValueOnce({
      createUser: () => Promise.resolve(null),
      getUserByEmail: (e: string) => {
        seen.push(e);
        return Promise.resolve(null);
      },
    });

    const { authOptions } = loadAuthOptions();
    await getAdapter(authOptions).getUserByEmail('  Person@Example.COM ');

    expect(seen).toEqual(['person@example.com']);
  });
});
