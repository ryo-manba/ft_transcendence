import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User, UserStatus } from '@prisma/client';

type Props = {
  userId: number;
  status: UserStatus;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/user/update-status`;

export const useMutationStatus = () => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    Error,
    Props
  >(
    async ({ userId, status }: Props) => {
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        endpoint,
        {
          userId,
          status,
        },
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
        console.error(err);
        throw err;
      },
    },
  );

  return { updateStatusMutation };
};
