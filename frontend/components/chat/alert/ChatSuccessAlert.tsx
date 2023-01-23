import { memo } from 'react';
import { ChatAlert } from 'components/chat/alert/ChatAlert';

type Props = {
  success: string;
  setSuccess: (success: string) => void;
};

export const ChatSuccessAlert = memo(function ChatSuccessAlert({
  success,
  setSuccess,
}: Props) {
  return (
    <ChatAlert severity="success" message={success} setMessage={setSuccess} />
  );
});
