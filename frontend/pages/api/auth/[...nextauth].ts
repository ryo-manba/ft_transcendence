import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FortyTwoProvider from 'next-auth/providers/42-school';

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    FortyTwoProvider({
      clientId: process.env.FORTYTWO_CLIENT_ID!,
      clientSecret: process.env.FORTYTWO_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    // ...add more providers here
  ],
  callbacks: {
    //    signIn({, account, profile, email, credentials}) {
    signIn() {
      // サインインした時に実施したい処理
      return true;
    },
    session({ session, token }) {
      if (token?.access_token) {
        session.access_token = token.access_token;
        session.id = token.sub;
      }

      return session;
    },
    jwt({ token, account }) {
      if (account?.access_token) {
        token.access_token = account.access_token;
      }

      return token;
    },
  },
});
