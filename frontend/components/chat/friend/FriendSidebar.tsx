import { memo, useState, useEffect } from 'react';
import { List } from '@mui/material';
import { Socket } from 'socket.io-client';
import { FriendAddButton } from 'components/chat/friend/FriendAddButton';
import { FriendListItem } from 'components/chat/friend/FriendListItem';
import { Loading } from 'components/common/Loading';
import { useQueryUser } from 'hooks/useQueryUser';
import { Friend } from 'types/friend';
import { fetchFollowingUsers } from 'api/friend/fetchFollowingUsers';
import { ChatBlockButton } from 'components/chat/block/ChatBlockButton';

type Props = {
  socket: Socket;
};

export const FriendSidebar = memo(function FriendSidebar({ socket }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading fullHeight />;
  }

  const handleRemoveFriendById = (removeId: number) => {
    setFriends((friends) => friends.filter((friend) => friend.id !== removeId));
  };

  useEffect(() => {
    const setupFriends = async () => {
      const res = await fetchFollowingUsers({ userId: user.id });

      setFriends(res);
    };

    void setupFriends();

    socket.on('chat:blocked', (blockedByUserId: number) => {
      console.log('chat:blocked', blockedByUserId);
      handleRemoveFriendById(blockedByUserId);
    });

    return () => {
      socket.off('chat:blocked');
    };
  }, []);

  return (
    <>
      <FriendAddButton setFriends={setFriends} />
      <ChatBlockButton
        socket={socket}
        removeFriendById={handleRemoveFriendById}
      />
      <List dense={false}>
        {friends &&
          friends.map((friend) => (
            <FriendListItem key={friend.id} friend={friend} socket={socket} />
          ))}
      </List>
    </>
  );
});
