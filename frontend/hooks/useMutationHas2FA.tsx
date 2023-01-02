import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';

export const useMutationHas2FA = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const changeHas2FAMutation = useMutation<
    boolean, // 戻り値の型
    AxiosError,
    { isEnable: boolean; userId: number; authCode: string } //mutate実行時の引数
  >(
    async ({ isEnable, userId, authCode }) => {
      if (isEnable) {
        // 登録時
        const { data } = await axios.patch<boolean>(
          `${process.env.NEXT_PUBLIC_API_URL as string}/auth/send2facode`,
          {
            userId: String(userId),
            code: authCode,
          },
        );

        return data;
      }
      // 解除時
      const { data } = await axios.patch<boolean>(
        `${
          process.env.NEXT_PUBLIC_API_URL as string
        }/auth/disable2fa/${userId}`,
      );

      return data;
    },
    {
      onSuccess: (res) => {
        if (res == true) {
          queryClient.removeQueries(['user']);
          void router.push('/setting'); //登録が成功したらsettingに戻る
        } else {
          // codeの数字が間違った場合
          throw new Error('Register ERROR Please Retry');
        }
      },
      onError: (err: AxiosError) => {
        // codeに数字以外が含まれる場合
        console.log(err);
        throw err;
      },
    },
  );

  return { changeHas2FAMutation };
};
