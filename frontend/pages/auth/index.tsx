import axios from 'axios';
import { useRouter } from 'next/router';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LoginResult, LoginResultStatus } from 'types';
import { UserInfo } from 'types/auth';
import { ValidationDialog } from 'components/auth/ValidationDialog';
import { Loading } from 'components/common/Loading';
import Debug from 'debug';
import { Alert, AlertTitle, Collapse, Typography } from '@mui/material';
import { useSocketStore } from 'store/game/ClientSocket';
import { SocketAuth } from 'types/game';

const Authenticate = () => {
  const debug = useMemo(() => Debug('authenticate'), []);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [validationUserId, setValidationUserId] = useState(0);
  const [error, setError] = useState('');
  const [timeId, setTimeId] = useState<NodeJS.Timeout | undefined>(undefined);
  const { socket } = useSocketStore();

  useEffect(() => {
    if (session === null || process.env.NEXT_PUBLIC_API_URL === undefined) {
      return;
    }

    const urlOauth = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth-login`;

    const redirectToLoginPageOnError = (message: string) => {
      setError(message);
      const id = setTimeout(() => {
        void signOut({ callbackUrl: '/' });
      }, 3000);

      setTimeId(id);
    };

    // OAuthで取得した情報より、どこからの認証か判断する。
    const isGoogleOAuth = (email: string | null | undefined) => {
      return email && email.indexOf('gmail.com') !== -1;
    };
    const isFortyTwoOAuth = (email: string | null | undefined) => {
      return email && email.indexOf('student.42tokyo.jp') !== -1;
    };

    // ログイン後の処理
    const processAfterLogin = async (loginResult: LoginResult) => {
      if (!loginResult) {
        redirectToLoginPageOnError('Login Failure');
      } else if (loginResult.res === LoginResultStatus.SUCCESS) {
        await router.push('/dashboard');
      } else if (
        loginResult.res === LoginResultStatus.NEED2FA &&
        loginResult.userId !== undefined
      ) {
        // 2FAコード入力ダイアログを表示
        setValidationUserId(loginResult.userId);
        setOpenValidationDialog(true);

        // 2FA中にログインページにリダイレクトした場合にstatusをoffにする。
        const socketAuth = { userId: loginResult.userId } as SocketAuth;
        socket.auth = socketAuth;
        socket.connect();
      } else {
        const errorMessage = loginResult.errorMessage
          ? loginResult.errorMessage
          : 'Login Failure';
        // ログイン失敗、signOutしてログインに戻る
        redirectToLoginPageOnError(errorMessage);
      }
    };

    // Googleの場合、初回認証時に取得したメールアドレスをusernameとしてログインする
    const googleLogin = async () => {
      if (!session.user.email) throw new Error('session info exception');
      const loginResponse = await axios.post<LoginResult>(urlOauth, {
        oAuthId: session.user.email,
        imagePath: session.user.image,
      });

      await processAfterLogin(loginResponse.data);
    };

    // 42の場合、アクセストークンを使ってuser情報を取得し、ログイン名・画像でログインする
    const fortyTwoLogin = async () => {
      const fortyTwoLoginUrl =
        'https://api.intra.42.fr/v2/users/' + String(session.user.id);
      const usersResponse = await axios.get<UserInfo>(fortyTwoLoginUrl, {
        headers: {
          Authorization: 'Bearer ' + String(session.user.accessToken),
        },
      });
      debug(usersResponse);
      const loginResponse = await axios.post<LoginResult>(urlOauth, {
        oAuthId: usersResponse.data.login,
        imagePath: usersResponse.data.image.link,
      });

      await processAfterLogin(loginResponse.data);
    };

    const loginAfterOAuth = async () => {
      try {
        if (isGoogleOAuth(session.user.email)) {
          await googleLogin();
        } else if (isFortyTwoOAuth(session.user.email)) {
          await fortyTwoLogin();
        } else {
          // どちらでもないOAuth認証は未対応
          redirectToLoginPageOnError('Login Failure');
        }
      } catch {
        // ログイン時のAxios例外の場合
        redirectToLoginPageOnError('Login Failure');
      }
    };

    debug(status);
    if (status === 'authenticated') {
      // 認証後、1回だけ呼び出される
      if (socket.disconnected) void loginAfterOAuth();
    } else if (status === 'unauthenticated') {
      void router.push('/');
    }

    return () => {
      clearTimeout(timeId);
    };
    // timeId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, debug, router, socket]);

  // 連続でOAuth=>2FAをすると不安定になるときがある。
  useEffect(() => {
    if (error !== '' && openValidationDialog) {
      setError('');
      clearTimeout(timeId);
    }
  }, [error, openValidationDialog, timeId]);

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
    <>
      <Collapse in={error !== ''}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Authorization Error</AlertTitle>
          <Typography variant="body2">
            {error} -{' '}
            <strong>It will automatically redirect to login page</strong>
          </Typography>
        </Alert>
      </Collapse>
      <ValidationDialog
        open={openValidationDialog}
        userId={validationUserId}
        onClose={handleClose}
      />
    </>
  );
};

export default Authenticate;
