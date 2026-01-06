import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/auth/prisma';

const authSecret = process.env.NEXTAUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

const requestBackendToken = async (payload: TokenRequestPayload): Promise<string | null> => {
  const normalizedEmail = normalizeEmail(payload.email);

  if (!normalizedEmail) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

if (!googleClientId || !googleClientSecret) {
  throw new Error('Google OAuth credentials are not configured.');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // After successful authentication, get the JWT from localStorage
        // which was set by the authAPI.login() call in the login page
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
