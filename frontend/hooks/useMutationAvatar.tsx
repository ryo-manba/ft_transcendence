import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { ClientUser } from 'types/user';
import Debug from 'debug';

type PropsForUpdate = {
  userId: number;
  updatedAvatarFile: FormData;
};

type PropsForDeletion = {
  userId: number;
  avatarPath: string;
};

const endpointForDeletion = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/user/delete-avatar`;

export const useMutationAvatar = () => {
  const debug = Debug('user');
  const queryClient = useQueryClient();

  const updateAvatarMutation = useMutation<
    ClientUser,
    AxiosError,
    PropsForUpdate
  >(
    async ({ userId, updatedAvatarFile }: PropsForUpdate) => {
      const { data } = await axios.post<ClientUser>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/user/avatar/${userId}`,
        updatedAvatarFile,
      );

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
        throw err;
      },
    },
  );

  const deleteAvatarMutation = useMutation<
    ClientUser,
    AxiosError,
    PropsForDeletion
  >(
    // Backend側でuserIdからいちいちavatarPathを取得してくる手間を省くためにavatarPathも送信
    async ({ userId, avatarPath }: PropsForDeletion) => {
      const { data } = await axios.patch<ClientUser>(endpointForDeletion, {
        userId,
        avatarPath,
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

  return { updateAvatarMutation, deleteAvatarMutation };
};
