import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { LoginUser } from 'types/user';
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

  const updatePointMutation = useMutation<LoginUser, Error, Props>(
    async ({ userId, updatedPoint }: Props) => {
      const { data } = await axios.patch<LoginUser>(endpoint, {
        userId,
        point: updatedPoint,
      });

      return data;
    },
    {
      onSuccess: (res) => {
        const oldUserData = queryClient.getQueryData<LoginUser>(['user']);
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
