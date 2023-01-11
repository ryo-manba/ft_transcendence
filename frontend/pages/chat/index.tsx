import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Grid from '@mui/material/Unstable_Grid2';
import { Header } from 'components/common/Header';
import { ChatroomSidebar } from 'components/chat/chatroom/ChatroomSidebar';
import { FriendSidebar } from 'components/chat/friend/FriendSidebar';
import { Message } from 'types/chat';
import { NextPage } from 'next';
import { Layout } from 'components/common/Layout';
import { ChatMessageExchange } from 'components/chat/message-exchange/ChatMessageExchange';

const appBarHeight = '64px';

const Chat: NextPage = () => {
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const temp = io('ws://localhost:3001/chat');
    setSocket(temp);

    return () => {
      temp.disconnect();
    };
  }, []);

  if (socket === undefined) {
    return null;
  }

  return (
    <Layout title="Chat">
      <Header title="Chatroom" />
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="stretch"
        style={{ height: `calc(100vh - ${appBarHeight})` }}
      >
        <Grid
          xs={2}
          style={{
            borderRight: '1px solid',
            borderBottom: '1px solid',
          }}
        >
          <ChatroomSidebar
            socket={socket}
            setCurrentRoomId={setCurrentRoomId}
            setMessages={setMessages}
          />
        </Grid>
        <Grid
          xs={8}
          style={{
            borderRight: '1px solid',
            borderBottom: '1px solid',
          }}
        >
          {currentRoomId && (
            <ChatMessageExchange
              socket={socket}
              currentRoomId={currentRoomId}
              messages={messages}
              setMessages={setMessages}
            />
          )}
        </Grid>
        <Grid
          xs={2}
          style={{
            borderBottom: '1px solid',
          }}
        >
          <FriendSidebar socket={socket} />
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Chat;
