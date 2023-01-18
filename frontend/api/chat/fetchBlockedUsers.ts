import axios from 'axios';
import { ChatUser } from 'types/chat';
import Debug from 'debug';

type Props = {
  userId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/chat/blocked-users`;

export const fetchBlockedUsers = async ({ userId }: Props) => {
  const debug = Debug('chat');
  try {
    const response = await axios.get<ChatUser[]>(endpoint, {
      params: { userId: userId },
    });

    return response.data;
  } catch (error) {
    debug(error);

    return [];
  }
};
