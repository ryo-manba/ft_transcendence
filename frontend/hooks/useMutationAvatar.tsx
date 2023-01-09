import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User } from '@prisma/client';

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
  const queryClient = useQueryClient();

  const updateAvatarMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    AxiosError,
    PropsForUpdate
  >(
    async ({ userId, updatedAvatarFile }: PropsForUpdate) => {
      const { data } = await axios.post<Omit<User, 'hashedPassword'>>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/user/avatar/${userId}`,
        updatedAvatarFile,
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
        console.error(err);
        throw err;
      },
    },
  );

  const deleteAvatarMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    AxiosError,
    PropsForDeletion
  >(
    // Backend側でuserIdからいちいちavatarPathを取得してくる手間を省くためにavatarPathも送信
    async ({ userId, avatarPath }: PropsForDeletion) => {
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        endpointForDeletion,
        {
          userId,
          avatarPath,
        },
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
        console.error(err);
      },
    },
  );

  return { updateAvatarMutation, deleteAvatarMutation };
};
