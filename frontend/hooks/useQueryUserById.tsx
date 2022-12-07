import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { User } from '@prisma/client';

export const useQueryUserById = (userId: number | undefined) => {
  const getUserById = async () => {
    if (userId === undefined || Number.isNaN(userId))
      throw new Error('User ID is invalid');

    const { data } = await axios.get<Omit<User, 'hashedPassword'>>(
      `${process.env.NEXT_PUBLIC_API_URL as string}/user/${userId}`,
    );

    // findUniqueの戻り値がnullの場合、dataはnullではなく''になるため
    // data === nullだとエラー判定ができないことからこのようなif文にしている
    if (Object.keys(data).length === 0) throw new Error('User not found');

    return data;
  };

  return useQuery<Omit<User, 'hashedPassword'> | undefined, Error>({
    queryKey: ['user', userId],
    queryFn: getUserById,
    onError: (err: Error) => {
      console.error(err);
    },
  });
};
