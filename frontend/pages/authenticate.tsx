import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Loading } from 'components/common/Loading';
import { LoginResult } from '../types';

const Authenticate = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    const oauthLogin = async () => {
      if (status === 'authenticated') {
        if (process.env.NEXT_PUBLIC_API_URL) {
          if (session && session.user !== undefined && session.user !== null) {
            let loginName = '';
            let imageUrl = '';
            console.log(session);
            if (
              session.user.email &&
              session.user.email.indexOf('gmail.com') !== -1
            ) {
              // gmailでのログインの場合
              loginName = session.user.email;
              if (session.user.image) imageUrl = session.user.image;
            } else if (session.user.email) {
              // TODO: 42のアカウントでは、access_tokenからログインIDと画像を取得する必要がある。別PRで対応
              loginName = session.user.email;
              imageUrl = '';
            }
            const urlOauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;
            const { data } = await axios.post<LoginResult>(urlOauth, {
              oAuthId: loginName,
              imagePath: imageUrl,
            });
            if (data.res === 'SUCCESS') {
              await router.push('/dashboard');
            } else if (data.res === 'NEED2FA' && data.userId !== undefined) {
              await router.push({
                pathname: '/validate2fa',
                query: { userId: data.userId },
              });
            } else {
              // ログイン失敗、signOutしてログインに戻る
              await signOut();
              await router.push('/');
            }
          }
        }
      }
    };
    void oauthLogin();
  }, []);

  return <Loading fullHeight={true} />;
};

export default Authenticate;
