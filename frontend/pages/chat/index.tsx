import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button, List } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ListItem from '@mui/material/ListItem';
// import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
// import Avatar from '@mui/material/Avatar';
import DeleteIcon from '@mui/icons-material/Delete';
// import FolderIcon from '@mui/icons-material/Folder';
// import ChatIcon from '@mui/icons-material/Chat';

type ChatRoom = {
  name: string;
  type: boolean;
  author: string;
  hashedPassword?: string;
};

const socket = io('http://localhost:3001/chat');

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

// const showRooms = (rooms: ChatRoom[]) => {
//   return rooms.map((item, i) => <li key={i}>{item.name}</li>);
// };

const ChatRoomList = (props: ChatRoom[]) => {
  return (
    <>
      <h2>Chat Room</h2>
      {/* denseが間隔を開けてくれる */}
      <List dense={true}>
        {props.map((item, i) => {
          return (
            <ListItem
              key={i}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => {
                    // TODO: deleteの処理
                    console.log('click delete');
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              }
              divider
              button
            >
              <ListItemText
                primary={item.name}
                onClick={() => {
                  // TODO: チャットルームを表示する処理
                  console.log('click text');
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </>
  );
};

const Chat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  // アクセス時にチャットルームのデータを受けとる
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
      <h1>Chat app</h1>
      <hr />
      <Button onClick={createChatRoom} variant="contained">
        チャットルームを作成する
      </Button>
      <Grid container spacing={1}>
        {/* 左側 */}
        <Grid xs={1}>{ChatRoomList(rooms)}</Grid>
        {/* 中央 */}
        <Grid xs={9}>
          <strong>チャットスペース</strong>
        </Grid>
        {/* 右側 */}
        <Grid xs={2}>
          <strong>フレンドスペース</strong>
        </Grid>
      </Grid>
    </>
  );
};

export default Chat;
