import axios from 'axios';
import { User } from '@prisma/client';

type Props = {
  userId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/user`;

export const getUserById = async ({
  userId,
}: Props): Promise<Omit<User, 'hashedPassword'>> => {
  try {
    if (Number.isNaN(userId)) throw new Error('UserId is invalid');

    const endpointWithParam = endpoint + '/' + String(userId);
    const { data } = await axios.get<Omit<User, 'hashedPassword'>>(
      endpointWithParam,
    );

    // findUniqueの戻り値がnullの場合、dataはnullではなく''になるため
    // data === nullだとエラー判定ができないことからこのようなif文にしている
    if (Object.keys(data).length === 0) throw new Error('User not found');

    return data;
  } catch (error) {
    console.error(error);

    throw error;
  }
};
