import {
  memo,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useMemo,
} from 'react';
import { Socket } from 'socket.io-client';
import { List } from '@mui/material';
import { ChatroomListItem } from 'components/chat/chatroom/ChatroomListItem';
import { ChatroomCreateButton } from 'components/chat/chatroom/ChatroomCreateButton';
import { ChatroomJoinButton } from 'components/chat/chatroom/ChatroomJoinButton';
import { Chatroom, CurrentRoom, Message } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatHeightStyle } from 'components/chat/utils/ChatHeightStyle';
import Debug from 'debug';

type Props = {
  socket: Socket;
  currentRoom: CurrentRoom | undefined;
  setCurrentRoom: Dispatch<SetStateAction<CurrentRoom | undefined>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setError: Dispatch<SetStateAction<string>>;
};

export const ChatroomSidebar = memo(function ChatroomSidebar({
  socket,
  currentRoom,
  setCurrentRoom,
  setMessages,
  setError,
}: Props) {
  const debug = useMemo(() => Debug('chat'), []);
  const { data: user } = useQueryUser();
  const [rooms, setRooms] = useState<Chatroom[]>([]);

  useEffect(() => {
    if (!socket || !user) return;
    // 入室しているルーム一覧を受け取る
    socket.on('chat:getJoinedRooms', (data: Chatroom[]) => {
      debug('chat:getJoinedRooms %o', data);
      setRooms(data);
    });

    // サイドバーのチャットルームを更新する
    socket.on('chat:updateSideBarRooms', () => {
      socket.emit('chat:getJoinedRooms', { userId: user.id });
    });

    // 現在所属しているチャットルームが削除された場合、表示されているチャット履歴を削除する
    socket.on('chat:deleteRoom', (deletedRoom: Chatroom) => {
      debug('chat:deleteRoom %o', deletedRoom);
      // socketの退出処理をする
      socket.emit('chat:leaveSocket', {
        roomId: deletedRoom.id,
      });
      setRooms((prev) => prev.filter((room) => room.id !== deletedRoom.id));
      // 表示中のメッセージを削除する
      setMessages([]);
      setCurrentRoom(undefined);
    });

    // 他のユーザーによってチャットルームに入室させられたときの処理
    socket.on('chat:joinRoomFromOtherUser', (joinedRoom: Chatroom) => {
      debug('joinRoomFromOtherUser:', joinedRoom);

      // 通知を受け取れるようソケットをjoinさせる
      socket.emit(
        'chat:socketJoinRoom',
        { roomId: joinedRoom.id },
        (res: boolean) => {
          if (res) {
            // サイドバーにチャットルームを追加する
            setRooms((prev) => [...prev, joinedRoom]);
          }
        },
      );
    });

    // チャットルームのオーナーが変わった場合にルームを差し替える
    socket.on('chat:changeRoomOwner', (changeRoom: Chatroom) => {
      debug('changeRoomOwner', changeRoom);

      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          return room.id === changeRoom.id ? changeRoom : room;
        }),
      );
    });

    // パスワードが消去されたときにadd passwordを可能にする
    socket.on('chat:deletePassword', (publicRoom: Chatroom) => {
      debug('deletePassword', publicRoom);

      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          return room.id === publicRoom.id ? publicRoom : room;
        }),
      );
    });

    // パスワードが追加されたときにchange passwordを可能にする
    socket.on('chat:addPassword', (protectedRoom: Chatroom) => {
      debug('addPassword', protectedRoom);

      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          return room.id === protectedRoom.id ? protectedRoom : room;
        }),
      );
    });

    // Kickされた場合にルームを削除する
    socket.on('chat:kicked', (chatroomId: number) => {
      debug('kicked from', chatroomId);

      if (chatroomId === currentRoom?.id) {
        setError(`You are kicked`);
        setCurrentRoom(undefined);
      }

      setRooms((prevRooms) =>
        prevRooms.filter((room) => room.id !== chatroomId),
      );
    });

    // setupが終わったら入室中のチャットルーム一覧を取得する
    socket.emit('chat:getJoinedRooms', { userId: user.id });

    return () => {
      socket.off('chat:getJoinedRooms');
      socket.off('chat:updateSideBarRooms');
      socket.off('chat:joinRoomFromOtherUser');
      socket.off('chat:changeRoomOwner');
      socket.off('chat:deletePassword');
      socket.off('chat:addPassword');
      socket.off('chat:kicked');
    };
  }, [
    user,
    debug,
    setCurrentRoom,
    setMessages,
    socket,
    setError,
    currentRoom?.id,
  ]);

  const addRooms = (room: Chatroom) => {
    setRooms((prev) => [...prev, room]);
  };

  if (user === undefined) {
    return <Loading />;
  }
  const heightStyle = ChatHeightStyle();

  return (
    <>
      <div
        style={{
          ...heightStyle,
          overflow: 'scroll',
        }}
      >
        <ChatroomCreateButton socket={socket} setRooms={setRooms} />
        <ChatroomJoinButton socket={socket} addRooms={addRooms} />
        <List dense={false}>
          {rooms &&
            rooms.map((room, i) => (
              <ChatroomListItem
                key={i}
                room={room}
                socket={socket}
                setCurrentRoom={setCurrentRoom}
                setMessages={setMessages}
              />
            ))}
        </List>
      </div>
    </>
  );
});
