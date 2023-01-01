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
    jwt({ token, account }) {
      // async jwt({ token, user, account, profile, isNewUser }) {
      if (account?.accessToken) {
        token.accessToken = account.accessToken;
      }

      return token;
    },
  },
  secret: process.env.JWT_SECRET,
});
