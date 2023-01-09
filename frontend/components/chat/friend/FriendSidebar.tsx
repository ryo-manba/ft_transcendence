import { memo, useState, useEffect } from 'react';
import { List } from '@mui/material';
import { Socket } from 'socket.io-client';
import { FriendAddButton } from 'components/chat/friend/FriendAddButton';
import { FriendListItem } from 'components/chat/friend/FriendListItem';
import { Loading } from 'components/common/Loading';
import { useQueryUser } from 'hooks/useQueryUser';
import { Friend } from 'types/friend';
import { fetchFollowingUsers } from 'api/friend/fetchFollowingUsers';

type Props = {
  socket: Socket;
};

export const FriendSidebar = memo(function FriendSidebar({ socket }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading fullHeight />;
  }

  useEffect(() => {
    let ignore = false;

    const fetchFriends = async (ignore: boolean) => {
      const res = await fetchFollowingUsers({ userId: user.id });

      if (!ignore) {
        setFriends(res);
      }
    };

    void fetchFriends(ignore);

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      {/* フレンド追加したら、リストを更新する */}
      <FriendAddButton setFriends={setFriends} />
      <List dense={false}>
        {friends &&
          friends.map((friend) => (
            <FriendListItem key={friend.id} friend={friend} socket={socket} />
          ))}
      </List>
    </>
  );
});
