import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button } from '@mui/material';

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

const showRooms = (rooms: ChatRoom[]) => {
  return rooms.map((item, i) => <li key={i}>{item.name}</li>);
};

const Chat = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

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
      <h2>Chat Room</h2>
      <ul>{showRooms(rooms)}</ul>
    </>
  );
};

export default Chat;
