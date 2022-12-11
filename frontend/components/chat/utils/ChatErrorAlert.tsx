import { memo } from 'react';
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
