import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { UserStatus } from '@prisma/client';
import { LoginUser } from 'types/user';
import Debug from 'debug';

type Props = {
  userId: number;
  status: UserStatus;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/user/update-status`;

export const useMutationStatus = () => {
  const debug = Debug('user');
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation<LoginUser, Error, Props>(
    async ({ userId, status }: Props) => {
      const { data } = await axios.patch<LoginUser>(endpoint, {
        userId,
        status,
      });

      return data;
    },
    {
      onSuccess: (res) => {
        // 'user'というキーでキャッシュされているデータがあれば取得
        const cachedUserData = queryClient.getQueryData<LoginUser>(['user']);

        // キャッシュされていたデータがある場合には、そのデータを更新
        if (cachedUserData) {
          queryClient.setQueryData(['user'], res);
        }
      },
      onError: (err: Error) => {
        debug(err);
        throw err;
      },
    },
  );

  return { updateStatusMutation };
};
