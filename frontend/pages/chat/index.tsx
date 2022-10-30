import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button, List } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { ChatHeader } from 'components/chat/ChatHeader';
import { ChatRoomListItem } from 'components/chat/ChatRoomListItem';

type ChatRoom = {
  name: string;
  type: boolean;
  author: string;
  hashedPassword?: string;
};

const socket = io('http://localhost:3001/chat');
const appBarHeight = '64px';

// TODO: name以外も指定できるようにする
const createChatRoom = () => {
  const name = String(window.prompt('チャンネル名を入力してください'));
  const room = {
    name: name,
    type: true,
    author: 'admin',
    hashedPassword: '',
  };
  socket.emit('room:create', room);
  console.log('[DEBUG] room:create', room);
};

const Chat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  // TODO: fetchに変更する
  useEffect(() => {
    socket.on('chat:connected', (data: ChatRoom[]) => {
      console.log('[DEBUG] chat:connected', data);
      setRooms(data);
    });

    return () => {
      socket.off('chat:connected');
    };
  }, []);

  // dbに保存ができたら,backendからreceiveする
  useEffect(() => {
    socket.on('room:created', (data: ChatRoom) => {
      console.log('[DEBUG] room:created', data);
      setRooms((rooms) => [...rooms, data]);
    });

    return () => {
      socket.off('room:created');
    };
  }, []);

  return (
    <>
      <ChatHeader />
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
          {/* TODO: Buttonコンポーネント作る */}
          <Button
            color="primary"
            variant="outlined"
            endIcon={
              <AddCircleOutlineRounded color="primary" sx={{ fontSize: 32 }} />
            }
            fullWidth={true}
            style={{ justifyContent: 'flex-start' }}
            onClick={createChatRoom}
          >
            チャットルーム作成
          </Button>
          <List dense={false}>
            {rooms.map((room, i) => (
              <ChatRoomListItem key={i} name={room.name} />
            ))}
          </List>
        </Grid>
        <Grid
          xs={8}
          style={{
            borderRight: '1px solid',
            borderBottom: '1px solid',
          }}
        >
          <h2>チャットスペース</h2>
        </Grid>
        <Grid
          xs={2}
          style={{
            borderBottom: '1px solid',
          }}
        >
          <h2>フレンドスペース</h2>
        </Grid>
      </Grid>
    </>
  );
};

export default Chat;
