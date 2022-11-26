import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { List, TextField, IconButton } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SendIcon from '@mui/icons-material/Send';
import { Header } from 'components/common/Header';
import { ChatroomListItem } from 'components/chat/ChatroomListItem';
import { ChatroomCreateButton } from 'components/chat/ChatroomCreateButton';
import { ChatroomJoinButton } from 'components/chat/ChatroomJoinButton';
import { Chatroom, Message } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';

const appBarHeight = '64px';

const Chat = () => {
  const [rooms, setRooms] = useState<Chatroom[]>([]);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const NOT_JOINED_ROOM = 0;
  const [currentRoomId, setCurrentRoomId] = useState(NOT_JOINED_ROOM);
  const [socket, setSocket] = useState<Socket>();

  const { data: user } = useQueryUser();

  useEffect(() => {
    const temp = io('ws://localhost:3001/chat');
    setSocket(temp);

    return () => {
      temp.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    // 入室しているルーム一覧を受け取る
    socket.on('chat:getJoinedRooms', (data: Chatroom[]) => {
      console.log('chat:getJoinedRooms', data);
      setRooms(data);
    });

    // 他ユーザーからのメッセージを受け取る
    socket.on('chat:receiveMessage', (data: Message) => {
      console.log('chat:receiveMessage', data.message);
      setMessages((prev) => [...prev, data]);
    });

    // 入室に成功したら、既存のメッセージを受け取る
    socket.on('chat:getMessage', (data: Message[]) => {
      setMessages(data);
    });

    // メッセージが送信できたら、反映させる
    socket.on('chat:sendMessage', (data: Message) => {
      console.log('chat:sendMessage', data.message);
      setMessages((prev) => [...prev, data]);
    });

    // チャットルームの作成処理が終わったら、反映させる
    socket.on('chat:createRoom', (chatroom: Chatroom) => {
      console.log('chat:createRoom', chatroom.name);
      setRooms((prev) => [...prev, chatroom]);
    });

    // 現在所属しているチャットルームが削除された場合、表示されているチャット履歴を削除する
    socket.on('chat:deleteRoom', (deletedRoom: Chatroom) => {
      console.log('chat:deleteRoom', deletedRoom);
      // 表示中のチャットを削除する
      setMessages([]);
      setCurrentRoomId(NOT_JOINED_ROOM);
      // socketの退出処理をする
      socket.emit('chat:leaveRoom');
      // 所属しているチャットルーム一覧を取得する
      socket.emit('chat:getJoinedRooms', user.id);
    });

    // サイドバーのチャットルームを更新する
    socket.on('chat:updateSideBarRooms', () => {
      socket.emit('chat:getJoinedRooms', user.id);
    });

    // setupが終わったら
    // 入室中のチャットルーム一覧を取得する
    socket.emit('chat:getJoinedRooms', user.id);

    return () => {
      socket.off('chat:getJoinedRooms');
      socket.off('chat:receiveMessage');
      socket.off('chat:getMessage');
      socket.off('chat:sendMessage');
      socket.off('chat:createRoom');
      socket.off('chat:deleteRoom');
      socket.off('chat:updateSideBarRooms');
    };
  }, [socket, user]);

  if (user === undefined) {
    return <h1>ユーザーが存在しません</h1>;
  }

  if (socket === undefined) {
    return null;
  }

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

    const message = {
      userId: user.id,
      chatroomId: currentRoomId,
      message: text,
    };

    socket.emit('chat:sendMessage', message);
    setText('');
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
          <ChatroomCreateButton socket={socket} />
          <ChatroomJoinButton socket={socket} user={user} />
          <List dense={false}>
            {rooms &&
              rooms.map((room, i) => (
                <ChatroomListItem
                  key={i}
                  room={room}
                  socket={socket}
                  setCurrentRoomId={setCurrentRoomId}
                />
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
          <h2>{`Hello: ${user.name}`}</h2>
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
