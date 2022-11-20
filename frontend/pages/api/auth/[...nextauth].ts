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
    signIn({}) {
      // async signIn({ user, account, profile, email, credentials }) {
      // サインインした時に実施したい処理
      console.log('signIn');
      // if (process.env.NEXT_PUBLIC_API_URL) {
      //   try {
      //     console.log('[TRY] login');
      //     const url_login = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
      //     await axios.post(url_login, {
      //       email: profile?.email,
      //       password: profile?.name,
      //     });
      //     console.log('[SUCCESS] login');
      //   } catch (e) {
      //     //未登録なのでsignupする。
      //     console.log('[FAILURE] login and do signup');
      //     try {
      //       await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
      //         email: profile?.email,
      //         password: profile?.name,
      //       });
      //       console.log('[SUCCESS] signup');
      //     } catch (e) {
      //       console.log('[FAILURE] signup');
      //     }
      //   }

      //   return true;
      // }

      return true;
    },
    jwt({ token, account }) {
      // async jwt({ token, user, account, profile, isNewUser }) {
      console.log('jwt');
      if (account?.accessToken) {
        token.accessToken = account.accessToken;
      }

      return token;
    },
    // session({ session, token }) {
    //   // async session({ session, user, token }) {
    //   console.log('session');
    //   // console.log(session);
    //   // sessionオブジェクトに情報を追加したい場合
    //   session.accessToken = token.accessToken;

    //   return session;
    // },
  },
});
