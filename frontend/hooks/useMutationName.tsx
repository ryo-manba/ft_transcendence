import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User } from '@prisma/client';
import Debug from 'debug';

export const useMutationName = () => {
  const debug = Debug('user');
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    AxiosError,
    { userId: number; updatedName: string }
  >(
    async ({ userId, updatedName }) => {
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/user/name/${userId}`,
        { name: updatedName },
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
        debug(err);
      },
    },
  );

  return { updateNameMutation };
};
