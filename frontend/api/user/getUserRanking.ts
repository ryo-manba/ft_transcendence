import axios from 'axios';

type Props = {
  userId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/user/ranking`;

export const getUserRanking = async ({ userId }: Props) => {
  try {
    const { data: ranking } = await axios.get<number>(endpoint, {
      params: { id: userId },
    });

    return ranking;
  } catch (error) {
    console.error(error);

    return undefined;
  }
};
