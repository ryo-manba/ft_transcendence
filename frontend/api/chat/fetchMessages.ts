import axios from 'axios';
import { Message } from 'types/chat';
import Debug from 'debug';

type Props = {
  roomId: number;
  userId: number;
  skip: number;
  pageSize?: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/chat/messages`;

export const fetchMessages = async ({
  roomId,
  userId,
  skip,
  pageSize,
}: Props) => {
  const debug = Debug('chat');
  try {
    const response = await axios.get<Message[]>(endpoint, {
      params: { roomId, userId, skip, pageSize },
    });

    return response.data;
  } catch (error) {
    debug(error);

    return [];
  }
};
