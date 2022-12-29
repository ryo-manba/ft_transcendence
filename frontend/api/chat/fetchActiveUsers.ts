import axios from 'axios';
import { ChatUser } from 'types/chat';

type Props = {
  roomId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/chat/active-users`;

export const fetchActiveUsers = async ({ roomId }: Props) => {
  try {
    const response = await axios.get<ChatUser[]>(endpoint, {
      params: { roomId: roomId },
    });

    return response.data;
  } catch (error) {
    console.log(error);

    return [];
  }
};
