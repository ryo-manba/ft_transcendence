import axios from 'axios';
import { useRouter } from 'next/router';
import { useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LoginResult, LoginResultStatus } from '../types';
import { ValidationDialog } from 'components/auth/ValidationDialog';
import { Loading } from 'components/common/Loading';
import Debug from 'debug';

const Authenticate = () => {
  const debug = Debug('authenticate');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [validationUserId, setValidationUserId] = useState(0);

  const oauthLogin = async () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      if (session && session.user !== undefined && session.user !== null) {
        let loginName = '';
        let imageUrl = '';
        debug(session);
        if (
          session.user.email &&
          session.user.email.indexOf('gmail.com') !== -1
        ) {
          // gmailでのログインの場合
          loginName = session.user.email;
          if (session.user.image) imageUrl = session.user.image;
        } else if (session.user.email) {
          // 42の場合、user情報を取得
          type Image = {
            link: string;
          };
          type UserInfo = {
            login: string;
            image: Image;
          };
          debug(session);
          const urlGetdata =
            'https://api.intra.42.fr/v2/users/' + String(session.user.id);
          const response = await axios.get<UserInfo>(urlGetdata, {
            headers: {
              Authorization: 'Bearer ' + String(session.user.accessToken),
            },
          });
          debug(response);
          loginName = response.data.login;
          imageUrl = response.data.image.link;
        }
        const urlOauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;
        const { data } = await axios.post<LoginResult>(urlOauth, {
          oAuthId: loginName,
          imagePath: imageUrl,
        });
        debug(data);
        if (data && data.res === LoginResultStatus.SUCCESS) {
          debug('login success');
          await router.push('/dashboard');
        } else if (
          data &&
          data.res === LoginResultStatus.NEED2FA &&
          data.userId !== undefined
        ) {
          // 2FAコード入力ダイアログを表示
          setValidationUserId(data.userId);
          setOpenValidationDialog(true);
        } else {
          // ログイン失敗、signOutしてログインに戻る
          debug('login failure');
          void signOut({ callbackUrl: '/' });
        }
      }
    }
  };

  // ValidateのDialogに失敗したらよばれる
  const handleClose = useCallback(() => {
    // ダイアログを閉じる
    setOpenValidationDialog(false);
    setValidationUserId(0);
    // 検証失敗したので、signOutしてログイン画面に戻る
    void signOut({ callbackUrl: '/' });
  }, [setOpenValidationDialog, setValidationUserId]);

  if (session === undefined || status === 'loading') {
    return <Loading fullHeight={true} />;
  } else if (status === 'authenticated') {
    void oauthLogin();
  } else {
    void router.push('/');
  }

  return (
    <ValidationDialog
      open={openValidationDialog}
      userId={validationUserId}
      onClose={handleClose}
    />
  );
};

export default Authenticate;
