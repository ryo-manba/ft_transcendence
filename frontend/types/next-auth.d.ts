import NextAuth, { Account, User, DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      accessToken: string;
      id: string;
    } & DefaultSession['user'];
  }

  interface Account {
    access_token: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
  }
}
