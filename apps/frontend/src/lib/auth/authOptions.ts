import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/auth/prisma';
import { getApiBaseUrl, API_VERSION } from '@/lib/apiBase';

const authSecret = process.env.NEXTAUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const API_BASE_URL = getApiBaseUrl();

// Google is optional. Throwing on missing OAuth env vars used to take down the
// whole NextAuth route handler, which made email/password sign-in impossible on
// any deployment without Google configured. Register the provider only when it
// is actually usable so credentials login never depends on it.
export const isGoogleAuthEnabled = Boolean(googleClientId && googleClientSecret);

const googleProvider =
  googleClientId && googleClientSecret
    ? GoogleProvider({ clientId: googleClientId, clientSecret: googleClientSecret })
    : null;

type ExtendedUser = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  image?: string | null;
};

type ExtendedToken = JWT & {
  user?: ExtendedUser;
  accessToken?: string;
  backendAccessToken?: string;
};

const sanitizeToken = (token?: string | null): string | null => {
  if (!token) return null;
  return token.trim();
};

const base64UrlDecode = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const input = normalized + padding;

  if (typeof window === 'undefined') {
    return Buffer.from(input, 'base64').toString('utf-8');
  }

  if (typeof window.atob === 'function') {
    return window.atob(input);
  }

  return Buffer.from(input, 'base64').toString('utf-8');
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const segments = token.split('.');
    if (segments.length !== 3) return null;
    const payload = base64UrlDecode(segments[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isBackendJwt = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  return Boolean(
    payload && typeof payload.userId === 'string' && typeof payload.email === 'string'
  );
};

const isJwtExpired = (token: string, skewSeconds = 30): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - skewSeconds <= now;
};

type TokenRequestPayload = {
  email?: string | null;
  name?: string | null;
  username?: string | null;
  image?: string | null;
};

const normalizeEmail = (email?: string | null): string | null => {
  if (!email) {
    return null;
  }
  const trimmed = email.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

/**
 * Look up a user by email, tolerating rows stored with non-canonical casing.
 *
 * Mirrors the backend helper of the same name: `findUnique` resolves every
 * account created since normalization via the unique index, while the
 * case-insensitive `findFirst` keeps pre-normalization accounts usable.
 */
const findUserByEmail = async (email: string) => {
  const exact = await prisma.user.findUnique({ where: { email } });
  if (exact) {
    return exact;
  }
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
};

/**
 * Enforce canonical email casing at the adapter boundary.
 *
 * Normalizing inside individual call sites was not sufficient: the Prisma
 * adapter persists OAuth users with whatever casing the provider returned, so
 * a Workspace address like "Person@x.com" could still produce a row that the
 * backend's normalized lookup would never match -- the duplicate-account bug
 * this normalization exists to prevent. Wrapping the adapter makes it
 * impossible for a future call site to skip the rule.
 */
const withNormalizedEmail = (adapter: Adapter): Adapter => ({
  ...adapter,
  // Annotate explicitly: `createUser` is a union of two call signatures, so
  // TypeScript cannot infer the parameter on its own.
  createUser: (data: { email: string }) =>
    adapter.createUser!({ ...data, email: normalizeEmail(data.email) ?? data.email }),
  getUserByEmail: (email) => adapter.getUserByEmail!(normalizeEmail(email) ?? email),
});

const requestBackendToken = async (payload: TokenRequestPayload): Promise<string | null> => {
  const normalizedEmail = normalizeEmail(payload.email);

  if (!normalizedEmail) {
    return null;
  }

  try {
    const internalSecret = process.env.INTERNAL_API_SECRET;
    const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': internalSecret || '',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        name: payload.name ?? null,
        username: payload.username ?? null,
        image: payload.image ?? null,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { accessToken?: string };
      const token = sanitizeToken(data.accessToken);
      if (token && isBackendJwt(token)) {
        return token;
      }
    }
  } catch (error) {
    console.error('Failed to get backend token:', error);
  }

  return null;
};

const ensureBackendToken = async (
  authToken: ExtendedToken,
  preferredEmail?: string | null
): Promise<void> => {
  const existing = sanitizeToken(authToken.backendAccessToken || authToken.accessToken || null);

  if (existing && isBackendJwt(existing) && !isJwtExpired(existing)) {
    authToken.backendAccessToken = existing;
    authToken.accessToken = existing;
    return;
  }

  const email = preferredEmail ?? authToken.user?.email ?? null;
  if (!email) {
    return;
  }

  const backendToken = await requestBackendToken({
    email,
    name: authToken.user?.name ?? null,
    username: authToken.user?.username ?? null,
    image: authToken.user?.image ?? null,
  });
  if (backendToken) {
    authToken.backendAccessToken = backendToken;
    authToken.accessToken = backendToken;
  }
};

if (!authSecret) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set.');
}

export const authOptions: NextAuthOptions = {
  adapter: withNormalizedEmail(PrismaAdapter(prisma)),
  secret: authSecret,
  session: {
    strategy: 'jwt',
  },
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Postgres `findUnique` on a text column is case-sensitive, so an
        // un-normalized lookup misses users who signed up with mixed-case email
        // (and would not match the lowercased row created via Google sign-in).
        const email = normalizeEmail(credentials.email);
        if (!email) {
          throw new Error('Email and password are required');
        }

        // Postgres `findUnique` on a text column is case-sensitive, so an
        // exact lookup alone misses users whose row still holds its original
        // casing. `findUnique` keeps the indexed fast path for canonical rows;
        // the case-insensitive `findFirst` is the legacy fallback.
        const user = await findUserByEmail(email);

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
        } as {
          id: string;
          email: string;
          name: string | null;
          username: string;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const authToken = token as ExtendedToken;

      if (user) {
        authToken.user = {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? null,
          username: (user as { username?: string }).username ?? null,
          image: (user as { image?: string | null }).image ?? null,
        };

        await ensureBackendToken(authToken, user.email);
      } else {
        await ensureBackendToken(authToken);
      }

      return authToken;
    },
    async session({ session, token }) {
      const authToken = token as ExtendedToken;

      if (authToken.user && session.user) {
        session.user.id = authToken.user.id;
        session.user.email = authToken.user.email;
        session.user.name = authToken.user.name;
        session.user.username = authToken.user.username;
        session.user.image = authToken.user.image ?? session.user.image ?? null;

        const backendToken = sanitizeToken(
          authToken.backendAccessToken || authToken.accessToken || null
        );
        if (backendToken && isBackendJwt(backendToken) && !isJwtExpired(backendToken)) {
          session.accessToken = backendToken;
          (session as typeof session & { backendAccessToken?: string }).backendAccessToken =
            backendToken;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
