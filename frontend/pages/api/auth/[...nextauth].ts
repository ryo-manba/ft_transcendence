import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FortyTwoProvider from 'next-auth/providers/42-school';

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    FortyTwoProvider({
      clientId: process.env.FORTYTWO_CLIENT_ID as string,
      clientSecret: process.env.FORTYTWO_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
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
        token.accessToken = account.accessToken as string;
      }

      return token;
    },
  },
  secret: process.env.JWT_SECRET,
});
