import axios from 'axios';
import { useRouter } from 'next/router';
import { useState, useCallback, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LoginResult, LoginResultStatus } from 'types';
import { UserInfo } from 'types/auth';
import { ValidationDialog } from 'components/auth/ValidationDialog';
import { Loading } from 'components/common/Loading';
import Debug from 'debug';

const Authenticate = () => {
  const debug = Debug('authenticate');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [validationUserId, setValidationUserId] = useState(0);

  useEffect(() => {
    let ignore = false;

    const oauthLogin = async () => {
      if (session === null || process.env.NEXT_PUBLIC_API_URL === undefined) {
        return;
      }
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
        const urlGetdata =
          'https://api.intra.42.fr/v2/users/' + String(session.user.id);
        try {
          const response = await axios.get<UserInfo>(urlGetdata, {
            headers: {
              Authorization: 'Bearer ' + String(session.user.accessToken),
            },
          });
          debug(response);
          loginName = response.data.login;
          imageUrl = response.data.image.link;
        } catch {
          // User情報取得に失敗した場合は、signOutしてログインに戻る
          debug('42 user info failure');
          void signOut({ callbackUrl: '/' });
        }
      }
      const urlOauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;
      try {
        const { data } = await axios.post<LoginResult>(urlOauth, {
          oAuthId: loginName,
          imagePath: imageUrl,
        });
        debug(data);
        if (data) {
          if (data.res === LoginResultStatus.SUCCESS) {
            debug('login success');
            await router.push('/dashboard');
          } else if (
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
      } catch {
        // backendへの登録で例外の場合、セッションを切断してログインページに戻る
        debug('login exception');
        void signOut({ callbackUrl: '/' });

        return;
      }
    };

    debug(status);
    if (status === 'authenticated' && !ignore) {
      // 認証後、1回だけ呼び出される
      void oauthLogin();
    } else if (status === 'unauthenticated') {
      void router.push('/');
    }

    return () => {
      ignore = true;
    };
  }, [status]);

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
