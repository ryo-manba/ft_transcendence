import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GameRecordWithUserName } from 'types/game';

export const useQueryGameRecords = (userId: number | undefined) => {
  const queryClient = useQueryClient();
  const router = useRouter();
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
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        queryClient.removeQueries(['user']);
        void axios.post(
          `${process.env.NEXT_PUBLIC_API_URL as string}/auth/logout`,
        );
        void router.push('/');
      }
    },
  });
};
