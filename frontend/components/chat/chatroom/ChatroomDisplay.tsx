import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { TextField, IconButton, Box, Collapse, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Chatroom, Message } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { MessageLeft } from 'components/chat/chatroom/ChatroomMessage';

type Props = {
  socket: Socket;
  currentRoomId: number;
  setCurrentRoomId: Dispatch<SetStateAction<number>>;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

export const ChatroomDisplay = memo(function ChatroomDisplay({
  currentRoomId,
  setCurrentRoomId,
  messages,
  setMessages,
  socket,
}: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>('');
  const { data: user } = useQueryUser();

  if (user === undefined) {
    return <Loading />;
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
    const message = {
      userId: user.id,
      chatroomId: currentRoomId,
      message: text,
    };

    socket.emit('chat:sendMessage', message, (res: boolean) => {
      if (!res) {
        setError('You can not send a message.');
      }
    });
    setText('');
  };

  useEffect(() => {
    if (!socket || !user) return;

    // 他ユーザーからのメッセージを受け取る
    socket.on('chat:receiveMessage', (data: Message) => {
      console.log('chat:receiveMessage', data.message);
      setMessages((prev) => [...prev, data]);
    });

    // 現在所属しているチャットルームが削除された場合、表示されているチャット履歴を削除する
    socket.on('chat:deleteRoom', (deletedRoom: Chatroom) => {
      console.log('chat:deleteRoom', deletedRoom);
      // 表示中のチャットを削除する
      setMessages([]);
      setCurrentRoomId(0);
      // socketの退出処理をする
      socket.emit('chat:leaveRoom');
      // 所属しているチャットルーム一覧を取得する
      socket.emit('chat:getJoinedRooms', user.id);
    });

    return () => {
      socket.off('chat:receiveMessage');
      socket.off('chat:deleteRoom');
    };
  }, [socket, user]);

  if (user === undefined) {
    return <Loading fullHeight />;
  }

  return (
    <>
      {/* <div style={{}}> */}
      <Paper
        style={{
          // padding: '0px',
          // position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            flexGrow: 1,
          }}
        >
          <MessageLeft
            message="sample"
            timestamp="MM/DD 00:00"
            photoURL="nourl"
            displayName=""
          />
          <MessageLeft
            message="sample"
            timestamp="MM/DD 00:00"
            photoURL="nourl"
            displayName=""
          />
        </div>
        <ul>{showMessage(messages)}</ul>
        <Box sx={{ width: '100%' }}>
          <Collapse in={error !== ''}>
            <ChatErrorAlert error={error} setError={setError} />
          </Collapse>
        </Box>
        <form style={{ display: 'flex', alignItems: 'center', padding: '2px' }}>
          <TextField
            autoFocus
            fullWidth
            style={{
              flexGrow: 1,
              bottom: 15,
              marginLeft: 5,
              marginRight: 5,
            }}
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
        </form>
      </Paper>
      {/* </div> */}
    </>
  );
});
