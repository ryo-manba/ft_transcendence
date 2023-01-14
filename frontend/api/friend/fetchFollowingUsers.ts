import axios from 'axios';
import { Friend } from 'types/friend';
import Debug from 'debug';

type Props = {
  userId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/friends/followings`;

export const fetchFollowingUsers = async ({ userId }: Props) => {
  const debug = Debug('friend');
  try {
    const response = await axios.get<Friend[]>(endpoint, {
      params: { id: userId },
    });

    return response.data;
  } catch (error) {
    debug(error);

    return [];
  }
};
