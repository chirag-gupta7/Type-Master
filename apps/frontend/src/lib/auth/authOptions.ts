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
    async jwt({ token, user, account }) {
      const authToken = token as JWT & {
        user?: {
          id: string;
          email: string;
          name: string | null;
          username: string | null;
          image: string | null;
        };
        accessToken?: string;
      };

      if (user) {
        authToken.user = {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? null,
          username: (user as { username?: string }).username ?? null,
          image: (user as { image?: string | null }).image ?? null,
        };

        // Try to get backend JWT from cookie (set by authAPI.login)
        // Cookies are accessible server-side, unlike localStorage
        if (typeof window !== 'undefined') {
          // Client-side: read from document.cookie
          const cookies = document.cookie.split('; ');
          const backendJwtCookie = cookies.find((c) => c.startsWith('backend_jwt='));
          if (backendJwtCookie) {
            const backendToken = backendJwtCookie.split('=')[1];
            if (backendToken) {
              authToken.accessToken = backendToken;
            }
          }
        }
      }

      // Store OAuth access token if available
      if (account?.access_token) {
        authToken.accessToken = account.access_token;
      }

      return authToken;
    },
    async session({ session, token }) {
      const authToken = token as JWT & {
        user?: {
          id: string;
          email: string;
          name: string | null;
          username: string | null;
          image: string | null;
        };
        accessToken?: string;
      };

      if (authToken.user && session.user) {
        session.user.id = authToken.user.id;
        session.user.email = authToken.user.email;
        session.user.name = authToken.user.name;
        session.user.username = authToken.user.username;
        session.user.image = authToken.user.image ?? session.user.image ?? null;

        // Attach access token to session for API calls
        if (authToken.accessToken) {
          session.accessToken = authToken.accessToken;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
