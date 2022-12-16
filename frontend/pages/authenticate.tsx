import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AxiosErrorResponse } from '../types';
import { Loading } from 'components/common/Loading';

const Authenticate = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    try {
      if (status === 'authenticated') {
        if (process.env.NEXT_PUBLIC_API_URL) {
          if (session && session.user) {
            const url_oauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;
            const imageUrl = session.user.image ? session.user.image : '';
            void axios
              .post(url_oauth, {
                oAuthId: session.user.email, //TODO: oAuthIdに変更したい
                imagePath: imageUrl,
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
    } catch (e) {
      console.log('[Exception] /auth/oauth-login failure');
      if (axios.isAxiosError(e) && e.response && e.response.data) {
        const messages = (e.response.data as AxiosErrorResponse).message;
        console.log(messages);
      }
    }
  }, []);

  return <Loading fullHeight={true} />;
};

export default Authenticate;
