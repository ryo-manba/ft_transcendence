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
            } else {
              // 42の場合、user情報を取得
              type Image = {
                link: string;
              };
              type UserInfo = {
                login: string;
                image: Image;
              };
              const url_getdata =
                'https://api.intra.42.fr/v2/users/' + String(session.user.id);
              const response = await axios.get<UserInfo>(url_getdata, {
                headers: {
                  Authorization: 'Bearer ' + String(session.user.access_token),
                },
              });
              login = response.data.login;
              image_url = response.data.image.link;
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
