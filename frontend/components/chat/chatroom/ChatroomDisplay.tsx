import {
  memo,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Dispatch,
  SetStateAction,
  MutableRefObject,
} from 'react';
import { Socket } from 'socket.io-client';
import { TextField, IconButton, Box, Collapse, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Chatroom, Message } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { MessageLeft } from 'components/chat/chatroom/ChatroomMessage';
import { fetchMessages } from 'api/chat/fetchMessages';

import { Virtuoso } from 'react-virtuoso';

const PAGE_SIZE = 10;
// import { loremIpsum } from 'lorem-ipsum';

type Props = {
  socket: Socket;
  currentRoomId: number;
  setCurrentRoomId: Dispatch<SetStateAction<number>>;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

type MessagesListProps = {
  chatId: number;
  startIndex: number;
  messages: Message[];
  virtuoso: MutableRefObject<null>;
  startReached: () => void;
};

function MessagesList({
  chatId,
  startIndex,
  messages,
  virtuoso,
  startReached,
}: MessagesListProps) {
  // messageが500件あったら500がfirstItemIndexになる
  // そこから0に向かって進んでいく
  const [firstItemIndex, setFirstItemIndex] = useState(
    startIndex - messages.length,
  );

  console.log('MessagesList: Starting firstItemIndex', firstItemIndex);
  console.log('MessagesList: Starting messages length', messages.length);
  console.log('chatId:', chatId);

  // 次のメッセージの先頭を更新してからmessageのリストを返す
  const internalMessages = useMemo(() => {
    const nextFirstItemIndex = startIndex - messages.length;
    setFirstItemIndex(nextFirstItemIndex);

    return messages;
  }, [messages]);

  // 取得したmessageをmapで表示する
  const itemContent = useCallback(
    (index: number, item: Message) => (
      <MessageLeft
        key={index}
        message={item.text}
        timestamp={item.createdAt}
        photoURL="nourl"
        displayName={item.userName}
      />
    ),
    [],
  );
  const followOutput = 'smooth';

  return (
    <div
      style={{
        display: 'flex',
        flexFlow: 'column',
        height: '100vh',
        marginBottom: '15px',
        // width: '350px',
      }}
    >
      {/* <div style={{ flex: '0 1 auto' }}> Messages for Chat {chatId} </div> */}
      <Virtuoso
        ref={virtuoso}
        initialTopMostItemIndex={internalMessages.length - 1}
        firstItemIndex={Math.max(0, firstItemIndex)}
        itemContent={itemContent}
        data={internalMessages}
        startReached={startReached}
        followOutput={followOutput}
        style={{ flex: '1 1 auto', overscrollBehavior: 'contain' }}
      />
    </div>
  );
}

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
  const [startIndex, setStartIndex] = useState(0);

  if (user === undefined) {
    return <Loading />;
  }

  console.log('chatDisplay:', currentRoomId);

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

  // WIP: ランダムメッセージを追加する
  // useEffect(() => {
  //   const initialMessages = Array.from({ length: 30 }, loremIpsum);
  //   for (let i = 0; i < initialMessages.length; i++) {
  //     const message = {
  //       userId: user.id,
  //       chatroomId: currentRoomId,
  //       message: initialMessages[i],
  //     };

  //     socket.emit('chat:sendMessage', message, (res: boolean) => {
  //       if (!res) {
  //         setError('You can not send a message.');
  //       }
  //     });
  //   }
  // }, [currentRoomId]);

  useEffect(() => {
    if (!socket || !user) return;

    // 他ユーザーからのメッセージを受け取る
    socket.on('chat:receiveMessage', (data: Message) => {
      console.log('chat:receiveMessage', data.text);
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
    setPage(1);

    const getMessagesCountInfo = {
      chatroomId: currentRoomId,
    };
    socket.emit(
      'chat:getMessagesCount',
      getMessagesCountInfo,
      (count: number) => {
        console.log('count: ', count);
        setStartIndex(count);
      },
    );
  }, [currentRoomId]);

  const fetchData = async (roomId: number, skip: number) => {
    // ページ番号をインクリメント
    console.log('fetchData page:', page);
    setPage((prev) => prev + 1);

    const chatMessages = await fetchMessages({
      roomId: roomId,
      skip: skip,
      pageSize: PAGE_SIZE,
    });
    console.log('chatMessages: ', chatMessages);
    // 全て取得済みの場合、もう読み込まないようにする
    if (chatMessages.length === 0) {
    } else {
      setMessages((prev) => [...prev, ...chatMessages]);
    }
  };

  useEffect(() => {
    setMessages([]);
    void fetchData(currentRoomId, page);
  }, [currentRoomId]);

  const virtuoso = useRef(null);
  const startReached = useCallback(() => {
    const timeout = 500;
    setTimeout(() => {
      void fetchData(currentRoomId, page);
    }, timeout);
  }, [messages]);

  if (user === undefined) {
    return <Loading fullHeight />;
  }

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
          <MessagesList
            chatId={currentRoomId}
            messages={messages}
            startReached={startReached}
            virtuoso={virtuoso}
            startIndex={startIndex}
          />
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
    </>
  );
});
