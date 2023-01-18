import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { Box, Collapse, Paper } from '@mui/material';
import { Message, CurrentRoom } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { ChatTextInput } from 'components/chat/message-exchange/ChatTextInput';
import { ChatMessageList } from 'components/chat/message-exchange/ChatMessageList';
import { ChatHeightStyle } from 'components/chat/utils/ChatHeightStyle';

type Props = {
  socket: Socket;
  currentRoom: CurrentRoom;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

export const ChatMessageExchange = memo(function ChatMessageExchange({
  socket,
  currentRoom,
  messages,
  setMessages,
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
      chatroomId: currentRoom.id,
      message: text,
    };

    socket.emit('chat:sendMessage', message, (err: string | undefined) => {
      if (err) {
        setError(err);
      }
    });
  };

  const heightStyle = ChatHeightStyle();

  return (
    <>
      <Paper
        style={{
          ...heightStyle,
          display: 'flex',
          flexDirection: 'column',
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
          <h3 className="my-2 ml-1 underline">#{currentRoom.name}</h3>
          <ChatMessageList
            currentRoomId={currentRoom.id}
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
          <ChatTextInput
            roomName={currentRoom.name}
            sendMessage={sendMessage}
          />
        </form>
      </Paper>
    </>
  );
});
