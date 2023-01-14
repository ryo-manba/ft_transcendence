import axios from 'axios';
import { Friend } from 'types/friend';
import Debug from 'debug';

type Props = {
  userId: number;
  roomId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/friends/joinable`;

export const fetchJoinableFriends = async ({ userId, roomId }: Props) => {
  const debug = Debug('friend');
  try {
    const response = await axios.get<Friend[]>(endpoint, {
      params: { userId: userId, roomId: roomId },
    });

    return response.data;
  } catch (error) {
    debug(error);

    return [];
  }
};
