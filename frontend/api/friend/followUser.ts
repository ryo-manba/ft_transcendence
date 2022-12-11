import axios from 'axios';
import type { Msg } from 'types/friend';

type Props = {
  followerId: number;
  followingId: number;
};

const endpoint = `${process.env.NEXT_PUBLIC_API_URL as string}/friends/follow`;

export const followUser = async ({
  followerId,
  followingId,
}: Props): Promise<Msg> => {
  // 例外処理をサーバーサイドで行っているため、例外は起きない
  const response = await axios.post<Msg>(endpoint, {
    followerId: followerId,
    followingId: followingId,
  });

  return response.data;
};
