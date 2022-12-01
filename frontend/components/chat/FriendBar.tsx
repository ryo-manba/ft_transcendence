import { useState, useEffect } from 'react';
import axios from 'axios';
import { List } from '@mui/material';
// import { FriendAddButton } from 'components/chat/FriendAddButton';
import { FriendListItem } from 'components/chat/FriendListItem';
import { Loading } from 'components/common/Loading';
import { useQueryUser } from 'hooks/useQueryUser';
import { Friend } from 'types/friend';

export const FriendBar = () => {
  const [friends, setFriends] = useState<Friend[]>([]); // fetchする
  const endpoint = `${
    process.env.NEXT_PUBLIC_API_URL as string
  }/friends/followings`;

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get<Friend[]>(endpoint, {
        params: { id: user.id },
      });

      setFriends(res.data);
    };

    fetchData()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      {/* <FriendAddButton /> */}
      <List dense={false}>
        {friends &&
          friends.map((friend) => (
            <FriendListItem key={friend.id} friend={friend} />
          ))}
      </List>
    </>
  );
};
