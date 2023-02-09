import axios from 'axios';
import { ChatUser } from 'types/chat';
import Debug from 'debug';

type Props = {
  roomId: number;
  userId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/chat/can-kick`;

export const fetchCanKickUsers = async ({ roomId, userId }: Props) => {
  const debug = Debug('chat');
  try {
    const response = await axios.get<ChatUser[]>(endpoint, {
      params: { roomId, userId },
    });

    return response.data;
  } catch (error) {
    debug(error);

    return [];
  }
};
