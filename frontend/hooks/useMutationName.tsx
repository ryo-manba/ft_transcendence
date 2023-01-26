import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { ClientUser } from 'types/user';
import Debug from 'debug';

type Props = {
  userId: number;
  updatedName: string;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/user/update-name`;

export const useMutationName = () => {
  const debug = Debug('user');
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation<ClientUser, AxiosError, Props>(
    async ({ userId, updatedName }: Props) => {
      const { data } = await axios.patch<ClientUser>(endpoint, {
        userId,
        name: updatedName,
      });

      return data;
    },
    {
      onSuccess: (res) => {
        const oldUserData = queryClient.getQueryData<ClientUser>(['user']);
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
