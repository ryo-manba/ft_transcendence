import {
  memo,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useMemo,
} from 'react';
import Debug from 'debug';
import { Socket } from 'socket.io-client';
import { Paper } from '@mui/material';
import { Message, CurrentRoom, ChatroomType } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatTextInput } from 'components/chat/message-exchange/ChatTextInput';
import { ChatMessageList } from 'components/chat/message-exchange/ChatMessageList';
import { ChatHeightStyle } from 'components/chat/utils/ChatHeightStyle';
import { ChatErrorAlert } from 'components/chat/alert/ChatErrorAlert';
import { ChatAlertCollapse } from 'components/chat/alert/ChatAlertCollapse';
import { fetchDMRecipientName } from 'api/chat/fetchDMRecipientName';
import { fetchBlockedUsers } from 'api/chat/fetchBlockedUsers';

type Props = {
  socket: Socket;
  currentRoom: CurrentRoom;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

const MAX_MESSAGE_LENGTH = 2000;

export const ChatMessageExchange = memo(function ChatMessageExchange({
  socket,
  currentRoom,
  messages,
  setMessages,
}: Props) {
  const debug = useMemo(() => Debug('chat'), []);
  const [error, setError] = useState('');
  const [blockedUserIds, setBlockedUserIds] = useState<number[]>([]);
  const { data: user } = useQueryUser();
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    let ignore = false;
    if (!user) return;

    const setupBlockedUserIds = async (userId: number) => {
      const blockedUsers = await fetchBlockedUsers({
        userId: userId,
      });
      const ids = blockedUsers.map((user) => user.id);
      if (!ignore) {
        setBlockedUserIds(ids);
      }
    };

    void setupBlockedUserIds(user.id);

    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!currentRoom) return;

    socket.on('chat:receiveMessage', (message: Message) => {
      debug('chat:receiveMessage ', message, currentRoom);

      const isBlocked = blockedUserIds.includes(message.userId);
      const isCurrentRoomMessage = message.roomId === currentRoom.id;
      if (isCurrentRoomMessage && !isBlocked) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off('chat:receiveMessage');
    };
  }, [user, blockedUserIds, socket, debug, setMessages, currentRoom]);

  useEffect(() => {
    let ignore = false;
    if (!user) return;

    const updateRoomName = async (room: CurrentRoom, userId: number) => {
      if (room.type === ChatroomType.DM) {
        const nameOfDMRecipient = await fetchDMRecipientName({
          roomId: room.id,
          senderUserId: userId,
        });
        if (!ignore) {
          setRoomName(nameOfDMRecipient);
        }
      } else {
        if (!ignore) {
          setRoomName(room.name);
        }
      }
    };

    void updateRoomName(currentRoom, user.id);

    return () => {
      ignore = true;
    };
  }, [user, currentRoom, debug, setMessages, socket]);

  if (user === undefined) {
    return <Loading fullHeight />;
  }

  const sendMessage = (text: string) => {
    if (MAX_MESSAGE_LENGTH < text.length) {
      setError(
        `The maximum length of a message is ${MAX_MESSAGE_LENGTH} characters.`,
      );

      return;
    }

    const message = {
      userId: user.id,
      userName: user.name,
      chatroomId: currentRoom.id,
      message: text,
    };

    socket.emit(
      'chat:sendMessage',
      message,
      (res: { error: string | undefined }) => {
        if (res.error) {
          setError(res.error);
        }
      },
    );
  };

  const heightStyle = ChatHeightStyle();

  return (
    <>
      <Paper
        style={{
          ...heightStyle,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="mb-4 flex grow-[1] flex-col">
          <h3 className="my-2 ml-1 overflow-hidden text-ellipsis whitespace-nowrap underline">
            #{currentRoom.name}
          </h3>
          <ChatMessageList
            socket={socket}
            messages={messages}
            currentRoomId={currentRoom.id}
            setMessages={setMessages}
            setBlockedUserIds={setBlockedUserIds}
          />
        </div>
        <ChatAlertCollapse show={error !== ''}>
          <ChatErrorAlert error={error} setError={setError} />
        </ChatAlertCollapse>
        <form style={{ display: 'flex', alignItems: 'center', padding: '2px' }}>
          <ChatTextInput roomName={roomName} sendMessage={sendMessage} />
        </form>
      </Paper>
    </>
  );
});
