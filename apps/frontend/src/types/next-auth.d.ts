import { DefaultSession } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string | null;
    } & DefaultSession['user'];
    accessToken?: string; // Backend JWT token (legacy)
    backendAccessToken?: string; // Backend JWT token
  }

  interface User {
    username?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    user?: {
      id: string;
      email: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    accessToken?: string; // Backend JWT token (legacy)
    backendAccessToken?: string; // Backend JWT token
  }
}
