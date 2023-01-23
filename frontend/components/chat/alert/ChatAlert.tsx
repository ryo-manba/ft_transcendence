import { memo, useEffect } from 'react';
import { IconButton, Alert, AlertColor } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  displayingTime?: number;
  severity: AlertColor;
  message: string;
  setMessage: (message: string) => void;
};

// 指定がない場合は以下の秒数(ミリ秒)でアラートを非表示にする
const DEFAULT_DISPLAYING_TIME = 3000;

export const ChatAlert = memo(function ChatAlert({
  displayingTime = DEFAULT_DISPLAYING_TIME,
  severity,
  message,
  setMessage,
}: Props) {
  useEffect(() => {
    // 一定時間経過したらアラートを非表示にする
    const timeId = setTimeout(() => {
      setMessage('');
    }, displayingTime);

    return () => {
      clearTimeout(timeId);
    };
    // NOTE: 依存配列にmessageを追加しないとアラートが呼ばれるたびにtimeoutが実行されない
  }, [message, displayingTime, setMessage]);

  return (
    <Alert
      severity={severity}
      action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={() => {
            setMessage('');
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
      sx={{ mb: 2 }}
    >
      {message}
    </Alert>
  );
});
