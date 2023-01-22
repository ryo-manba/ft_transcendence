import axios from 'axios';
import { LoginUser } from 'types/user';
import Debug from 'debug';

type Props = {
  userId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/user`;

export const getUserById = async ({ userId }: Props): Promise<LoginUser> => {
  const debug = Debug('user');
  try {
    if (Number.isNaN(userId)) throw new Error('UserId is invalid');

    const endpointWithParam = endpoint + '/' + String(userId);
    const { data } = await axios.get<LoginUser>(endpointWithParam);

    // findUniqueの戻り値がnullの場合、dataはnullではなく''になるため
    // data === nullだとエラー判定ができないことからこのようなif文にしている
    if (Object.keys(data).length === 0) throw new Error('User not found');

    return data;
  } catch (error) {
    debug(error);

    throw error;
  }
};
