import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LoginResult, LoginResultStatus } from '../types';
import { ValidationDialog } from 'components/auth/ValidationDialog';
import Debug from 'debug';

const Authenticate = () => {
  const debug = Debug('authenticate');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [validationUserId, setValidationUserId] = useState(0);

  useEffect(() => {
    const oauthLogin = async () => {
      if (status === 'authenticated') {
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
              // TODO: 現在はOAuth認証後に2回/auth/oauth-loginを呼んでしまい、
              // 2回目がfailureとなることで初回登録時はログインページに戻ってしまう。
              debug('login failure');
              void signOut({ callbackUrl: `http://localhost:3000/` });
            }
          }
        }
      }
    };
    void oauthLogin();
  }, []);

  if (status === 'unauthenticated') {
    void router.push('/');
  }

  // ValidateのDialogに失敗したらよばれる
  const handleClose = useCallback(() => {
    // ダイアログを閉じる
    setOpenValidationDialog(false);
    setValidationUserId(0);
    // 検証失敗したので、signOutしてログイン画面に戻る
    void signOut({ callbackUrl: `http://localhost:3000/` });
  }, [setOpenValidationDialog, setValidationUserId]);

  return (
    <ValidationDialog
      open={openValidationDialog}
      userId={validationUserId}
      onClose={handleClose}
    />
  );
};

export default Authenticate;
