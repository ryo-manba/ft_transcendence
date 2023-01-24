import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
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
  setCurrentRoom: Dispatch<SetStateAction<CurrentRoom | undefined>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

export const ChatroomSidebar = memo(function ChatroomSidebar({
  socket,
  setCurrentRoom,
  setMessages,
}: Props) {
  const debug = Debug('chat');
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

    // setupが終わったら入室中のチャットルーム一覧を取得する
    socket.emit('chat:getJoinedRooms', { userId: user.id });

    return () => {
      socket.off('chat:getJoinedRooms');
      socket.off('chat:updateSideBarRooms');
      socket.off('chat:joinRoomFromOtherUser');
      socket.off('chat:changeRoomOwner');
    };
  }, []);

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
