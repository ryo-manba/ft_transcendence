import { memo } from 'react';
import { ChatAlert } from 'components/chat/alert/ChatAlert';

type Props = {
  error: string;
  setError: (error: string) => void;
};

export const ChatErrorAlert = memo(function ChatErrorAlert({
  error,
  setError,
}: Props) {
  return <ChatAlert severity="error" message={error} setMessage={setError} />;
});
