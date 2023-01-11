import axios from 'axios';
import { UserStatus } from '@prisma/client';
import Debug from 'debug';

type Props = {
  userId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/user/status`;

export const getUserStatusById = async ({ userId }: Props) => {
  const debug = Debug('user');
  try {
    if (Number.isNaN(userId)) throw new Error('UserId is invalid');
    const { data } = await axios.get<UserStatus>(endpoint, {
      params: { id: userId },
    });

    if (Object.keys(data).length === 0) throw new Error('User not found');

    return data;
  } catch (error) {
    debug(error);

    return 'OFFLINE';
  }
};
