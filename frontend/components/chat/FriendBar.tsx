import { useState, useEffect } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import { List } from '@mui/material';
import { FriendAddButton } from 'components/chat/FriendAddButton';
import { User } from '@prisma/client';

type Props = {
  user: Omit<User, 'hashedPassword'>;
  socket: Socket;
};

type FollowingUser = {
  id: number;
  name: string;
};

export const FriendBar = ({ user, socket }: Props) => {
  const [friends, setFriends] = useState<FollowingUser[]>([]); // fetchする
  useEffect(() => {
    const endpoint = `${
      process.env.NEXT_PUBLIC_API_URL as string
    }/friends/followings`;

    // TODO:　bodyでuserIdを送信できるようにする
    const fetchData = async () => {
      const res = await axios.get<FollowingUser[]>(endpoint, {
        data: { userId: user.id },
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
      <FriendAddButton socket={socket} user={user} />
      <List dense={false}>
        {friends &&
          friends.map((friend, i) => (
            <div key={i}>
              <div>{friend.id}</div>
              <div>{friend.name}</div>
            </div>
          ))}
      </List>
    </>
  );
};
