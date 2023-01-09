import axios, { AxiosError } from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User } from '@prisma/client';

type Props = {
  userId: number;
  updatedName: string;
};

const endpoint = `${
  process.env.NEXT_PUBLIC_API_URL as string
}/user/update-name`;

export const useMutationName = () => {
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    AxiosError,
    Props
  >(
    async ({ userId, updatedName }: Props) => {
      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        endpoint,
        { userId, name: updatedName },
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

  return { updateNameMutation };
};
