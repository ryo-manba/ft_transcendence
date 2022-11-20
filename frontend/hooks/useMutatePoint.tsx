import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User } from '@prisma/client';

export const useMutatePoint = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const updatePointMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    AxiosError,
    { userId: number; updatedPoint: number }
  >(
    async ({ userId, updatedPoint }) => {
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/user/${userId}`,
        { point: updatedPoint },
      );

      return data;
    },
    {
      onSuccess: (res) => {
        const oldUserData = queryClient.getQueryData<
          Omit<User, 'hashedPassword'>
        >(['user']);
        if (oldUserData) {
          queryClient.setQueryData(['user'], res);
        }
      },
      onError: (err: AxiosError) => {
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          void router.push('/');
        }
      },
    },
  );

  return { updatePointMutation };
};
