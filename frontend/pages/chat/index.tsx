import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button, List, TextField, IconButton } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import SendIcon from '@mui/icons-material/Send';
import { Header } from 'components/common/Header';
import { ChatRoomListItem } from 'components/chat/ChatRoomListItem';

type ChatRoom = {
  name: string;
  type: boolean;
  author: string;
  hashedPassword?: string;
};

type Message = {
  userId: number;
  roomId: number;
  message: string;
};

const socket = io('http://localhost:3001/chat');
const appBarHeight = '64px';

// TODO: name以外も指定できるようにする
const createChatRoom = () => {
  const name = window.prompt('チャンネル名を入力してください');
  if (name === null || name.length === 0) {
    return;
  }
  const room = {
    name: name,
    type: true,
    author: 'admin',
    hashedPassword: '',
  };
  socket.emit('chat:create', room);
  console.log('chat:create', room);
};

const Chat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    socket.on('chat:getRooms', (data: ChatRoom[]) => {
      console.log('chat:getRooms', data);
      setRooms(data);
    });
    // chatroom一覧を取得する
    socket.emit('chat:getRooms');

    return () => {
      socket.off('chat:getRooms');
    };
  }, []);

  // dbに保存ができたら,backendからreceiveする
  useEffect(() => {
    socket.on('chat:create', (data: ChatRoom) => {
      console.log('chat:create', data);
      setRooms((rooms) => [...rooms, data]);
    });

    return () => {
      socket.off('chat:create');
    };
  }, []);

  const showMessage = (list: Message[]) => {
    return list.map((item, i) => (
      <li key={i}>
        <strong>{item.userId}: </strong>
        {item.message}
      </li>
    ));
  };

  const sample = () => {
    console.log('sample: before->', text);
    setText('');
    console.log('sample: after->', text);
  };

  // send a message to the server
  const sendMessage = () => {
    console.log('chat:sendMessage -> emit');
    const message = { userId: 1, roomId: 1, message: text };
    socket.emit('chat:sendMessage', message);
    console.log('text before:', text);
    // setText('');
    sample();
    console.log('text after:', text);
  };

  // receive a message from the server
  useEffect(() => {
    socket.on('chat:sendMessage', (data: Message) => {
      console.log('chat:sendMessage -> receive', data.message);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('chat:sendMessage');
    };
  }, []);

  return (
    <>
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
          <div style={{ marginLeft: 5, marginRight: 5 }}>
            <TextField
              autoFocus
              fullWidth
              label="Message"
              id="Message"
              type="text"
              variant="standard"
              size="small"
              value={text}
              placeholder={`#roomへメッセージを送信`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              onChange={(e) => {
                setText(e.target.value);
              }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={sendMessage}>
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
            <p>
              <strong>Talk Room</strong>
            </p>
            <ul>{showMessage(messages)}</ul>
          </div>
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
