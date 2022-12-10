import axios from 'axios';
import { UserStatus } from '@prisma/client';

type Props = {
  userId: number;
  status: UserStatus;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/user/status`;

export const updateUserStatusById = async ({ userId, status }: Props) => {
  try {
    const endpointWithParams =
      endpoint + '/' + String(userId) + '/' + String(status);
    const { data } = await axios.patch<boolean>(endpointWithParams);

    return data;
  } catch (error) {
    console.error(error);

    return false;
  }
};
