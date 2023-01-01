import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loading } from 'components/common/Loading';

const Authenticate = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    const f = async () => {
      if (status === 'authenticated') {
        if (process.env.NEXT_PUBLIC_API_URL) {
          if (session && session.user !== undefined && session.user !== null) {
            let login = '';
            let image_url = '';
            console.log(session);
            if (
              session.user.email &&
              session.user.email.indexOf('gmail.com') !== -1
            ) {
              // gmailでのログインの場合
              login = session.user.email;
              if (session.user.image) image_url = session.user.image;
            } else if (session.user.email) {
              // TODO: 42のアカウントでは、access_tokenからログインIDと画像を取得する必要がある。別PRで対応
              login = session.user.email;
              image_url = '';
            }
            const url_oauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;
            await axios
              .post(url_oauth, {
                oAuthId: login,
                imagePath: image_url,
              })
              .then((res) => {
                console.log(res);
                void router.push('/dashboard');
              })
              .catch((err) => {
                console.log(err);
              });
          }
        }
      }
    };
    void f();
  }, []);

  return <Loading fullHeight={true} />;
};

export default Authenticate;
