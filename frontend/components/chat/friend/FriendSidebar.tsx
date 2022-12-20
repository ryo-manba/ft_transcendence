import { useState, useEffect } from 'react';
import { List } from '@mui/material';
import { FriendAddButton } from 'components/chat/friend/FriendAddButton';
import { FriendListItem } from 'components/chat/friend/FriendListItem';
import { Loading } from 'components/common/Loading';
import { useQueryUser } from 'hooks/useQueryUser';
import { Friend } from 'types/friend';
import { fetchFollowingUsers } from 'api/friend/fetchFollowingUsers';

export const FriendSidebar = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading fullHeight />;
  }

  useEffect(() => {
    const fetchFriends = async () => {
      const res = await fetchFollowingUsers({ userId: user.id });

      setFriends(res);
    };

    void fetchFriends();
  }, []);

  return (
    <>
      {/* フレンド追加したら、リストを更新する */}
      <FriendAddButton setFriends={setFriends} />
      <List dense={false}>
        {friends &&
          friends.map((friend) => (
            <FriendListItem key={friend.id} friend={friend} />
          ))}
      </List>
    </>
  );
};
