import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User } from '@prisma/client';
import Debug from 'debug';

type Props = {
  userId: number;
  updatedPoint: number;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/user/update-point`;

export const useMutationPoint = () => {
  const debug = Debug('user');
  const queryClient = useQueryClient();

  const updatePointMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    Error,
    Props
  >(
    async ({ userId, updatedPoint }: Props) => {
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        endpoint,
        { userId, point: updatedPoint },
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
      onError: (err: Error) => {
        debug(err);
      },
    },
  );

  return { updatePointMutation };
};
