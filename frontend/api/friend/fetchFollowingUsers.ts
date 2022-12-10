import axios from 'axios';
import { Friend } from 'types/friend';

type Props = {
  userId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/friends/followings`;

export const fetchFollowingUsers = async ({ userId }: Props) => {
  try {
    const response = await axios.get<Friend[]>(endpoint, {
      params: { id: userId },
    });

    return response.data;
  } catch (error) {
    console.log(error);

    return [];
  }
};
