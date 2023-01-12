import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LoginResult, LoginResultStatus } from '../types';
import { ValidationDialog } from 'components/auth/ValidationDialog';

const Authenticate = () => {
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
            if (data.res === LoginResultStatus.SUCCESS) {
              await router.push('/dashboard');
            } else if (
              data.res === LoginResultStatus.NEED2FA &&
              data.userId !== undefined
            ) {
              setValidationUserId(data.userId);
              setOpenValidationDialog(true);
            } else {
              // ログイン失敗、signOutしてログインに戻る
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
