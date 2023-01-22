import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoginUser } from 'types/user';

export const useQueryUser = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const getUser = async () => {
    const { data } = await axios.get<LoginUser>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/user`,
    );

    return data;
  };

  return useQuery<LoginUser, AxiosError>({
    queryKey: ['user'],
    queryFn: getUser,
    onError: (err: AxiosError) => {
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        const user: LoginUser | undefined = queryClient.getQueryData(['user']);
        if (user !== undefined) {
          void axios.post(
            `${process.env.NEXT_PUBLIC_API_URL as string}/auth/logout`,
            {
              id: user.id,
            },
          );
          queryClient.removeQueries(['user']);
        }
        void router.push('/');
      }
    },
    staleTime: Infinity,
    cacheTime: 10 * 60 * 1000,
  });
};
