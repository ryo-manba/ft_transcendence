import axios from 'axios';
import { ChatUser } from 'types/chat';

type Props = {
  userId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/chat/unblocked-users`;

export const fetchUnblockedUsers = async ({ userId }: Props) => {
  try {
    const response = await axios.get<ChatUser[]>(endpoint, {
      params: { userId: userId },
    });

    return response.data;
  } catch (error) {
    console.log(error);

    return [];
  }
};
