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
    if (session === null || process.env.NEXT_PUBLIC_API_URL === undefined) {
      return;
    }

    const urlOauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;

    // OAuthで取得した情報より、どこからの認証か判断する。
    const isGoogleOAuth = (email: string | null | undefined) => {
      return email && email !== undefined && email.indexOf('gmail.com') !== -1;
    };

    // Googleの場合、初回認証時に取得したメールアドレスをusernameとしてログインする
    const googleLogin = async () => {
      if (!session.user.email || session.user.email === undefined)
        throw new Error('session info exception');
      const login_response = await axios.post<LoginResult>(urlOauth, {
        oAuthId: session.user.email,
        imagePath: session.user.image,
      });

      return login_response.data;
    };

    // 42の場合、アクセストークンを使ってuser情報を取得し、ログイン名・画像でログインする
    const fortyTwoLogin = async () => {
      const urlGetdata =
        'https://api.intra.42.fr/v2/users/' + String(session.user.id);
      const users_response = await axios.get<UserInfo>(urlGetdata, {
        headers: {
          Authorization: 'Bearer ' + String(session.user.accessToken),
        },
      });
      debug(users_response);
      const login_response = await axios.post<LoginResult>(urlOauth, {
        oAuthId: users_response.data.login,
        imagePath: users_response.data.image.link,
      });

      return login_response.data;
    };

    const loginAfterOAuth = async () => {
      try {
        const loginResult = isGoogleOAuth(session.user.email)
          ? await googleLogin()
          : await fortyTwoLogin();
        debug(loginResult);
        if (!loginResult) {
          void signOut({ callbackUrl: '/' });
        } else if (loginResult.res === LoginResultStatus.SUCCESS) {
          await router.push('/dashboard');
        } else if (
          loginResult.res === LoginResultStatus.NEED2FA &&
          loginResult.userId !== undefined
        ) {
          // 2FAコード入力ダイアログを表示
          setValidationUserId(loginResult.userId);
          setOpenValidationDialog(true);
        } else {
          // ログイン失敗、signOutしてログインに戻る
          void signOut({ callbackUrl: '/' });
        }
      } catch {
        // ログイン時のAxios例外などは、signOutしてログインに戻る
        void signOut({ callbackUrl: '/' });

        return;
      }
    };

    debug(status);
    if (status === 'authenticated') {
      // 認証後、1回だけ呼び出される
      void loginAfterOAuth();
    } else if (status === 'unauthenticated') {
      void router.push('/');
    }
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
