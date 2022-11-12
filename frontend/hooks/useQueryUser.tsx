import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { User } from '@prisma/client';

export const useQueryUser = (enabled = true) => {
  const router = useRouter();
  const getUser = async () => {
    const { data } = await axios.get<Omit<User, 'hashedPassword'>>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/user`,
    );

    return data;
  };

  return useQuery<Omit<User, 'hashedPassword'>, AxiosError>({
    queryKey: ['user'],
    queryFn: getUser,
    onError: (err: AxiosError) => {
      if (err.response?.status === 401 || err.response?.status === 403)
        void router.push('/');
    },
    staleTime: Infinity,
    cacheTime: 60 * 60 * 1000,
    enabled: enabled,
  });
};
