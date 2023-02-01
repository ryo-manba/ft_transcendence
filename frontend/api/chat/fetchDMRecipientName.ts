import axios from 'axios';
import Debug from 'debug';

type Props = {
  roomId: number;
  senderUserId: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/chat/dm-recipient-name`;

export const fetchDMRecipientName = async ({ roomId, senderUserId }: Props) => {
  const debug = Debug('chat');
  try {
    const response = await axios.get<string>(endpoint, {
      params: { roomId, senderUserId },
    });

    if (!response.data) {
      return '';
    }

    return response.data;
  } catch (error) {
    debug(error);

    return '';
  }
};
