import axios from 'axios';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { User } from '@prisma/client';

export const useMutationPoint = () => {
  const queryClient = useQueryClient();

  const updatePointMutation = useMutation<
    Omit<User, 'hashedPassword'>,
    Error,
    { userId: number; updatedPoint: number }
  >(
    async ({ userId, updatedPoint }) => {
      if (Number.isNaN(userId) || Number.isNaN(updatedPoint)) throw new Error();

      const { data } = await axios.patch<Omit<User, 'hashedPassword'>>(
        `${process.env.NEXT_PUBLIC_API_URL as string}/user/point/${userId}`,
        { point: updatedPoint },
      );

      if (Object.keys(data).length === 0) throw new Error();

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
      onError: (err: Error) => {
        console.log(err);
      },
    },
  );

  return { updatePointMutation };
};
