import axios from 'axios';
import { ChatUser } from 'types/chat';
import Debug from 'debug';

type Props = {
  roomId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/chat/normal-users`;

export const fetchChatroomNormalUsers = async ({ roomId }: Props) => {
  const debug = Debug('chat');
  try {
    const response = await axios.get<ChatUser[]>(endpoint, {
      params: { roomId: roomId },
    });

    return response.data;
  } catch (error) {
    debug(error);

    return [];
  }
};
