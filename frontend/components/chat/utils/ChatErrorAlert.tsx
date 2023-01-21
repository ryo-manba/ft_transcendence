import { memo, useEffect } from 'react';
import { IconButton, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  error: string;
  setError: (error: string) => void;
};

export const ChatErrorAlert = memo(function ChatErrorAlert({
  error,
  setError,
}: Props) {
  useEffect(() => {
    // 一定時間経過したらアラートを非表示にする
    const displayingAlertTime = 3000;
    const timeId = setTimeout(() => {
      setError('');
    }, displayingAlertTime);

    return () => {
      clearTimeout(timeId);
    };
  }, [error, setError]);

  return (
    <Alert
      severity="error"
      action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={() => {
            setError('');
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
      sx={{ mb: 2 }}
    >
      {error}
    </Alert>
  );
});
