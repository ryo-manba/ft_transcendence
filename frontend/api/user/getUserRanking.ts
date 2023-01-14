import axios from 'axios';
import Debug from 'debug';

type Props = {
  userId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/user/ranking`;

export const getUserRanking = async ({ userId }: Props) => {
  const debug = Debug('user');
  try {
    const { data: ranking } = await axios.get<number>(endpoint, {
      params: { id: userId },
    });

    return ranking;
  } catch (error) {
    debug(error);

    return undefined;
  }
};
