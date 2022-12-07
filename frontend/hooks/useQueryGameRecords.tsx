import axios, { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { GameRecordWithUserName } from 'types/game';

export const useQueryGameRecords = (userId: number | undefined) => {
  const getGameRecords = async () => {
    if (userId === undefined || Number.isNaN(userId))
      throw new Error('User ID is invalid');
    const { data } = await axios.get<GameRecordWithUserName[]>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/records/${userId}`,
    );

    // findUniqueの戻り値がnullの場合、dataはnullではなく''になるため
    // data === nullだとエラー判定ができないことからこのようなif文にしている
    if (Object.keys(data).length === 0)
      throw new Error('User records not found');

    return data;
  };

  return useQuery<GameRecordWithUserName[] | undefined, AxiosError>({
    queryKey: ['game', userId],
    queryFn: getGameRecords,
    onError: (err: AxiosError) => {
      console.error(err);
    },
  });
};
