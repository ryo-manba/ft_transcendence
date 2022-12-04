import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '@prisma/client';

export const useQueryUserById = (userId: number | undefined) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const getUserById = async () => {
    if (userId === undefined) return undefined;
    const { data } = await axios.get<Omit<User, 'hashedPassword'>>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/user/${userId}`,
    );

    return data;
  };

  return useQuery<Omit<User, 'hashedPassword'> | undefined, AxiosError>({
    queryKey: ['user', userId],
    queryFn: getUserById,
    onError: (err: AxiosError) => {
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        queryClient.removeQueries(['user', userId]);
        void axios.post(
          `${process.env.NEXT_PUBLIC_API_URL as string}/auth/logout`,
        );
        void router.push('/');
      }
    },
  });
};
