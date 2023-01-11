import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User, UserStatus } from '@prisma/client';
import Debug from 'debug';

type Props = {
  userId: number;
  status: UserStatus;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/user/status`;

export const useMutationStatus = () => {
  const debug = Debug('user');
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    Error,
    Props
  >(
    async ({ userId, status }: Props) => {
      const endpointWithParams =
        endpoint + '/' + String(userId) + '/' + String(status);
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        endpointWithParams,
      );

      return data;
    },
    {
      onSuccess: (res) => {
        // 'user'というキーでキャッシュされているデータがあれば取得
        const cachedUserData = queryClient.getQueryData<
          Omit<User, 'hashedPassword'>
        >(['user']);

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
