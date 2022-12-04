import { memo, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { List } from '@mui/material';
import { ChatroomListItem } from 'components/chat/chatroom/ChatroomListItem';
import { ChatroomCreateButton } from 'components/chat/chatroom/ChatroomCreateButton';
import { ChatroomJoinButton } from 'components/chat/chatroom/ChatroomJoinButton';
import { Chatroom, Message } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';

type Props = {
  socket: Socket;
  setCurrentRoomId: (id: number) => void;
  setMessages: (message: Message[]) => void;
};

export const ChatroomSidebar = memo(function ChatroomSidebar({
  socket,
  setCurrentRoomId,
  setMessages,
}: Props) {
  const { data: user } = useQueryUser();
  const [rooms, setRooms] = useState<Chatroom[]>([]);

  useEffect(() => {
    if (!socket || !user) return;
    // 入室しているルーム一覧を受け取る
    socket.on('chat:getJoinedRooms', (data: Chatroom[]) => {
      console.log('chat:getJoinedRooms', data);
      setRooms(data);
    });
    // チャットルームの作成処理が終わったら、反映させる
    socket.on('chat:createRoom', (chatroom: Chatroom) => {
      console.log('chat:createRoom', chatroom.name);
      setRooms((prev) => [...prev, chatroom]);
    });
    // サイドバーのチャットルームを更新する
    socket.on('chat:updateSideBarRooms', () => {
      socket.emit('chat:getJoinedRooms', user.id);
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

    // setupが終わったら
    // 入室中のチャットルーム一覧を取得する
    socket.emit('chat:getJoinedRooms', user.id);

    return () => {
      socket.off('chat:getJoinedRooms');
      socket.off('chat:createRoom');
      socket.off('chat:updateSideBarRooms');
    };
  }, []);

  if (user === undefined) {
    return <Loading />;
  }

  return (
    <>
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
    </>
  );
});
