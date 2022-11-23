import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { GameRecordWithUserName } from 'types/game';

export const useQueryGameRecords = () => {
  const router = useRouter();
  const getGameRecords = async () => {
    const { data } = await axios.get<GameRecordWithUserName[]>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/records`,
    );

    return data;
  };

  return useQuery<GameRecordWithUserName[], AxiosError>({
    queryKey: ['game'],
    queryFn: getGameRecords,
    onError: (err: AxiosError) => {
      if (err.response?.status === 401 || err.response?.status === 403)
        void router.push('/');
    },
  });
};
