import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/auth/prisma';

const authSecret = process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set.');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  session: {
    strategy: 'jwt',
  },
  providers: [
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
      const authToken = token as JWT & {
        user?: {
          id: string;
          email: string;
          name: string | null;
          username: string | null;
        };
      };

      if (user) {
        authToken.user = {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? null,
          username: (user as { username?: string }).username ?? null,
        };
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
        };
      };

      if (authToken.user && session.user) {
        session.user.id = authToken.user.id;
        session.user.email = authToken.user.email;
        session.user.name = authToken.user.name;
        session.user.username = authToken.user.username;
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
