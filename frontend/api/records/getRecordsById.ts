import axios from 'axios';
import { GameRecordWithUserName } from 'types/game';

type Props = {
  userId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/records`;

export const getRecordsById = async ({ userId }: Props) => {
  try {
    if (Number.isNaN(userId)) {
      throw new Error('UserId is invalid');
    }
    const endpointWithParam = endpoint + '/' + String(userId);
    const { data } = await axios.get<GameRecordWithUserName[]>(
      endpointWithParam,
    );

    return data;
  } catch (error) {
    console.error(error);

    throw error;
  }
};
