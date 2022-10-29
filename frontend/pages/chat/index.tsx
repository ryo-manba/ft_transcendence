import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button, List } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { ChatHeader } from '../../components/chat/ChatHeader';
// import { ChatRoomList } from '../../components/chat/ChatRoomList';

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

const ChatRoomList = (props: ChatRoom[]) => {
  return (
    <>
      <div style={{ backgroundColor: 'white' }}>
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
          {props.map((item, i) => {
            return (
              <ListItem
                key={i}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => {
                      // TODO: チャットルームを削除する
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
                    // TODO: チャットルームに入る
                    console.log('click text');
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </div>
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
      <ChatHeader />
      <div style={{ backgroundColor: 'white' }}>
        <Grid container spacing={2}>
          <Grid xs={2} style={{ borderRight: '1px solid grey' }}>
            {ChatRoomList(rooms)}
          </Grid>
          <Grid xs={8} style={{ borderRight: '1px solid grey' }}>
            <h2 style={{ margin: '0px' }}>チャットスペース</h2>
          </Grid>
          <Grid xs={2}>
            <h2 style={{ margin: '0px' }}>フレンドスペース</h2>
          </Grid>
        </Grid>
      </div>
    </>
  );
};

export default Chat;
