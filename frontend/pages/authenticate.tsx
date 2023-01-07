import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loading } from 'components/common/Loading';

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
            const { data } = await axios.post<boolean>(urlOauth, {
              oAuthId: loginName,
              imagePath: imageUrl,
            });
            if (data === true) {
              void router.push('/dashboard');
            } else {
              void router.push('/validate2fa');
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
