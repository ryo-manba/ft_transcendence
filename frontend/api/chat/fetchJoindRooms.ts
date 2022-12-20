import axios from 'axios';
import type { Chatroom } from 'types/chat';

type Props = {
  userId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/chat/joined-rooms`;

export const fetchJoinedRooms = async ({ userId }: Props) => {
  try {
    const response = await axios.get<Chatroom[]>(endpoint, {
      params: { userId: userId },
    });

    return response.data;
  } catch (error) {
    console.log(error);

    return [];
  }
};
