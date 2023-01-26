import { NextPage } from 'next';
import { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import Grid from '@mui/material/Unstable_Grid2';
import { Message, CurrentRoom } from 'types/chat';
import { Header } from 'components/common/Header';
import { ChatroomSidebar } from 'components/chat/chatroom/ChatroomSidebar';
import { FriendSidebar } from 'components/chat/friend/FriendSidebar';
import { Layout } from 'components/common/Layout';
import { ChatMessageExchange } from 'components/chat/message-exchange/ChatMessageExchange';
import { Loading } from 'components/common/Loading';
import { useQueryUser } from 'hooks/useQueryUser';
import { ChatHeightStyle } from 'components/chat/utils/ChatHeightStyle';
import { ChatErrorAlert } from 'components/chat/alert/ChatErrorAlert';
import { ChatAlertCollapse } from 'components/chat/alert/ChatAlertCollapse';
import Debug from 'debug';

const Chat: NextPage = () => {
  const debug = useMemo(() => Debug('chat'), []);
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<CurrentRoom | undefined>(
    undefined,
  );
  const [error, setError] = useState('');
  const { data: user } = useQueryUser();

  useEffect(() => {
    const temp = io('ws://localhost:3001/chat');
    setSocket(temp);
    if (temp.disconnected) temp.connect();

    return () => {
      temp.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!user || !socket) return;

    socket.on('chat:handleConnection', () => {
      // 通知を受けるためにソケットの初期設定を行う(入室しているルームにjoinする)
      socket.emit('chat:initSocket', user.id);
    });

    socket.on('chat:banned', () => {
      setError('You are banned.');
      setCurrentRoom(undefined);
    });

    // バックエンドのvalidation errorをチャッチ
    socket.on('exception', (data: { status: string; message: string }) => {
      debug('receive exception: %o', data);
      setError('Something went wrong...');
    });

    return () => {
      socket.off('chat:handleConnection');
      socket.off('chat:banned');
      socket.off('exception');
    };
  }, [user, socket, debug]);

  if (socket === undefined || user === undefined) {
    return <Loading fullHeight />;
  }

  const heightStyle = ChatHeightStyle();

  return (
    <Layout title="Chat">
      <Header title="Chatroom" />
      <ChatAlertCollapse show={error !== ''}>
        <ChatErrorAlert error={error} setError={setError} />
      </ChatAlertCollapse>
      <Grid
        container
        direction="row"
        justifyContent="center"
        alignItems="stretch"
        style={heightStyle}
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
            setCurrentRoom={setCurrentRoom}
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
          {currentRoom && (
            <ChatMessageExchange
              socket={socket}
              currentRoom={currentRoom}
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
          <FriendSidebar socket={socket} setCurrentRoom={setCurrentRoom} />
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Chat;
