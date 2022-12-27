import axios from 'axios';
import { Message } from 'types/chat';

type Props = {
  roomId: number;
  skip: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/chat/messages`;

export const fetchMessages = async ({ roomId, skip }: Props) => {
  try {
    const response = await axios.get<Message[]>(endpoint, {
      params: { roomId, skip },
    });

    return response.data;
  } catch (error) {
    console.log(error);

    return [];
  }
};
