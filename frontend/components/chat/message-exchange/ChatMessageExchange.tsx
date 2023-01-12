import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { Box, Collapse, Paper } from '@mui/material';
import { Message } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { ChatTextInput } from 'components/chat/message-exchange/ChatTextInput';
import { ChatMessageList } from 'components/chat/message-exchange/ChatMessageList';

type Props = {
  socket: Socket;
  currentRoomId: number;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

export const ChatMessageExchange = memo(function ChatMessageExchange({
  currentRoomId,
  messages,
  setMessages,
  socket,
}: Props) {
  const [error, setError] = useState('');
  const { data: user } = useQueryUser();

  useEffect(() => {
    if (!user) return;

    // 他ユーザーからのメッセージを受け取る
    socket.on('chat:receiveMessage', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('chat:receiveMessage');
    };
  }, [user]);

  if (user === undefined) {
    return <Loading fullHeight />;
  }

  const sendMessage = (text: string) => {
    const message = {
      userId: user.id,
      userName: user.name,
      chatroomId: currentRoomId,
      message: text,
    };

    socket.emit('chat:sendMessage', message, (res: boolean) => {
      if (!res) {
        setError('You can not send a message.');
      }
    });
  };

  const appBarHeight = '64px';

  return (
    <>
      <Paper
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: `calc(100vh - ${appBarHeight})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            marginBottom: '15px',
            flexGrow: 1,
          }}
        >
          <ChatMessageList
            currentRoomId={currentRoomId}
            messages={messages}
            setMessages={setMessages}
            socket={socket}
          />
        </div>
        <Box sx={{ width: '100%' }}>
          <Collapse in={error !== ''}>
            <ChatErrorAlert error={error} setError={setError} />
          </Collapse>
        </Box>
        <form style={{ display: 'flex', alignItems: 'center', padding: '2px' }}>
          <ChatTextInput sendMessage={sendMessage} />
        </form>
      </Paper>
    </>
  );
});
