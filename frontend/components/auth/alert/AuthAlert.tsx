import { Alert, AlertColor, AlertTitle, Typography } from '@mui/material';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

type Props = {
  displayingTime?: number;
  severity: AlertColor;
  message: string;
  setMessage: (message: string) => void;
  readyRedirect: boolean;
};

const DEFAULT_DISPLAYING_TIME = 3000;

export const AuthAlert = ({
  displayingTime = DEFAULT_DISPLAYING_TIME,
  severity,
  message,
  setMessage,
  readyRedirect,
}: Props) => {
  const [timeId, setTimeId] = useState<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!readyRedirect) return;

    // 一定時間経過したらアラートを非表示にする
    const id = setTimeout(() => {
      void signOut({ callbackUrl: '/' });
    }, displayingTime);

    setTimeId(id);

    return () => {
      clearTimeout(timeId);
    };

    // NOTE: 依存配列にmessageを追加しないとアラートが呼ばれるたびにtimeoutが実行されない
    // timeIdで無限ループする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, displayingTime, setMessage, readyRedirect]);

  // 連続でOAuth=>2FAをすると不安定になるときがある。
  useEffect(() => {
    if (message !== '' && !readyRedirect) {
      setMessage('');
      clearTimeout(timeId);
    }
  }, [message, readyRedirect, timeId, setMessage]);

  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      <AlertTitle>Authorization Error</AlertTitle>
      <Typography variant="body2">
        {message} -{' '}
        <strong>It will automatically redirect to login page</strong>
      </Typography>
    </Alert>
  );
};
