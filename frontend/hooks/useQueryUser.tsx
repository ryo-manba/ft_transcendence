import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientUser } from 'types/user';

export const useQueryUser = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const getUser = async () => {
    const { data } = await axios.get<ClientUser>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/user`,
    );

    return data;
  };

  return useQuery<ClientUser, AxiosError>({
    queryKey: ['user'],
    queryFn: getUser,
    onError: (err: AxiosError) => {
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        const user: ClientUser | undefined = queryClient.getQueryData(['user']);
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
