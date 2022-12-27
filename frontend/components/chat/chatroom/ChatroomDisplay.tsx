import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { TextField, IconButton, Box, Collapse, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Chatroom, Message } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { MessageLeft } from 'components/chat/chatroom/ChatroomMessage';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fetchMessages } from 'api/chat/fetchMessages';

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
  const [page, setPage] = useState(1); // ページ番号を保持するstate
  const [isLoading, setIsLoading] = useState(true);

  if (user === undefined) {
    return <Loading />;
  }

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

  useEffect(() => {
    setIsLoading(true);
  }, [currentRoomId]);

  if (user === undefined) {
    return <Loading fullHeight />;
  }

  // const getMessages = () => {
  //   console.log('getMessages');
  //   if (currentRoomId === 0) {
  //     return;
  //   }

  //   // ページ番号をインクリメント
  //   setPage((prev) => prev + 1);

  //   const data = {
  //     chatroomId: currentRoomId,
  //     skip: page,
  //   };
  //   socket.emit('chat:getMessages', data, (res: Message[]) => {
  //     console.log('res:', res);
  //     setMessages([...messages, ...res]);
  //     setIsLoading(false);
  //   });
  // };

  const fetchData = async (roomId: number, skip: number) => {
    // ページ番号をインクリメント
    console.log('page:', page);
    setPage((prev) => prev + 1);

    const res = await fetchMessages({ roomId: roomId, skip: skip });
    // 全て取得済みの場合、もう読み込まないようにする
    if (res.length === 0) {
      setIsLoading(false);
    } else {
      setMessages((prev) => [...prev, ...res]);
    }
  };

  const fetchMoreData = () => {
    console.log('fetchMoreData');
    if (currentRoomId === 0) {
      setIsLoading(false);

      return;
    } else {
      setIsLoading(true);
    }

    setTimeout(() => {
      void fetchData(currentRoomId, page);
    }, 1500);
    // setIsLoading(false);
  };

  const appBarHeight = '64px';

  return (
    <>
      <Paper
        style={{
          // padding: '0px',
          // position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: `calc(100vh - ${appBarHeight})`,
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
          <InfiniteScroll
            dataLength={messages.length}
            next={fetchMoreData}
            hasMore={isLoading}
            loader={<Loading />}
            endMessage={
              <p>
                <b>Yay! You have seen it all</b>
              </p>
            }
          >
            {messages.map((item, i) => (
              <MessageLeft
                key={i}
                message={item.message}
                timestamp={'MM/DD 00:00'}
                photoURL="nourl"
                displayName=""
              />
            ))}
          </InfiniteScroll>
        </div>

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
