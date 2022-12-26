import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';

export const useMutationHas2FA = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const enableHas2FAMutation = useMutation<
    string, // 戻り値の型
    AxiosError,
    { userId: number; authCode: string } //mutate実行時の引数
  >(
    async ({ userId, authCode }) => {
      const { data } = await axios.patch<string>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/auth/send2facode`,
        {
          userId: String(userId),
          code: authCode,
        },
      );

      return data; //この場合、success,failureが返る。
    },
    {
      onSuccess: (res) => {
        if (res == 'success') {
          queryClient.removeQueries(['user']);
          void router.push('/setting'); //登録が成功したらsettingに戻る
        } else {
          console.log('Register ERROR Please Retry');
          // TODO: できたらここで失敗したアラート表示
        }
      },
      onError: (err: AxiosError) => {
        console.log(err);
        throw err;
      },
    },
  );

  const disableHas2FAMutation = useMutation<
    string,
    AxiosError,
    { userId: number }
  >(
    async ({ userId }) => {
      const { data } = await axios.patch<string>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/auth/disable2fa`,
        {
          userId: String(userId),
          code: '1234', //登録時と同じ型を使うためダミーの値を設定している
        },
      );

      return data;
    },
    {
      onSuccess: (res) => {
        if (res == 'disabled: true') {
          //TODO: 登録解除したアラート出したい
          console.log('Successs Disabled');
          console.log(res);
          queryClient.removeQueries(['user']);
        }
      },
      onError: (err: AxiosError) => {
        console.log(err);
      },
    },
  );

  return { enableHas2FAMutation, disableHas2FAMutation };
};
