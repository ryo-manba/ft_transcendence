import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { List, TextField, IconButton } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SendIcon from '@mui/icons-material/Send';
import { Header } from 'components/common/Header';
import { ChatroomListItem } from 'components/chat/ChatroomListItem';
import { ChatroomCreateButton } from 'components/chat/ChatroomCreateButton';
import { Chatroom, Message } from 'types/chat';

const appBarHeight = '64px';

const Chat = () => {
  const [rooms, setRooms] = useState<Chatroom[]>([]);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState(0);
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const temp = io('ws://localhost:3001/chat');
    setSocket(temp);

    return () => {
      temp.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat:getRooms', (data: Chatroom[]) => {
      console.log('chat:getRooms', data);
      setRooms(data);
    });
    // chatroom一覧を取得する
    socket.emit('chat:getRooms');

    return () => {
      socket.off('chat:getRooms');
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on('chat:receiveMessage', (data: Message) => {
      console.log('chat:receiveMessage -> receive', data.message);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('chat:receiveMessage');
    };
  }, [socket]);

  // 入室に成功したら、既存のメッセージを受け取る
  useEffect(() => {
    if (!socket) return;
    socket.on('chat:joinRoom', (data: Message[]) => {
      setMessages(data);
    });

    return () => {
      socket.off('chat:joinRoom');
    };
  });

  // receive a message from the server
  useEffect(() => {
    if (!socket) return;
    socket.on('chat:sendMessage', (data: Message) => {
      console.log('chat:sendMessage -> receive', data.message);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('chat:sendMessage');
    };
  }, [socket]);

  const showMessage = (list: Message[]) => {
    return list.map((item, i) => (
      <li key={i}>
        <strong>{item.userId}: </strong>
        {item.message}
      </li>
    ));
  };

  // send a message to the server
  const sendMessage = () => {
    if (!socket) return;

    // TODO: userIdをuserから取得できるようにする置き換える
    const message = { userId: 1, chatroomId: currentRoomId, message: text };
    console.log('sendMessage:', message);

    socket.emit('chat:sendMessage', message);
    setText('');
  };

  const joinRoom = (id: number) => {
    if (!socket) return;
    console.log('joinRoom:', id);
    const res = socket.emit('chat:joinRoom', id);
    if (res) {
      setCurrentRoomId(id);
    }
  };

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
          {socket !== undefined && <ChatroomCreateButton socket={socket} />}
          <List dense={false}>
            {rooms.map((room, i) => (
              <ChatroomListItem key={i} room={room} joinRoom={joinRoom} />
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
            <div style={{ display: 'flex', alignItems: 'end' }}>
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
            </div>
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
