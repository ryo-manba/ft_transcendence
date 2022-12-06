import axios, { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { GameRecordWithUserName } from 'types/game';

export const useQueryGameRecords = (userId: number | undefined) => {
  const getGameRecords = async () => {
    if (userId === undefined) return undefined;
    const { data } = await axios.get<GameRecordWithUserName[]>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/records/${userId}`,
    );

    return data;
  };

  return useQuery<GameRecordWithUserName[] | undefined, AxiosError>({
    queryKey: ['game', userId],
    queryFn: getGameRecords,
    onError: (err: AxiosError) => {
      console.log(err);
      throw err;
    },
  });
};
