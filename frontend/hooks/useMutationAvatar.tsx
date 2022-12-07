import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User } from '@prisma/client';

export const useMutationAvatar = () => {
  const queryClient = useQueryClient();

  const updateAvatarMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    AxiosError,
    { userId: number; updatedAvatarFile: FormData }
  >(
    async ({ userId, updatedAvatarFile }) => {
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
        console.log(err);
        throw err;
      },
    },
  );

  const deleteAvatarMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    AxiosError,
    { userId: number; avatarPath: string }
  >(
    // Backend側でuserIdからいちいちavatarPathを取得してくる手間を省くためにavatarPathも送信
    async ({ userId, avatarPath }) => {
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        `${
          process.env.NEXT_PUBLIC_API_URL as string
        }/user/avatar/${userId}/${avatarPath}`,
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
        console.log(err);
      },
    },
  );

  return { updateAvatarMutation, deleteAvatarMutation };
};
