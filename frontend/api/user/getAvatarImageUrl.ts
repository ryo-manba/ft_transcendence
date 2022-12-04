import { User } from '@prisma/client';

export const getAvatarImageUrl = (
  user: Omit<User, 'hashedPassword'> | undefined,
): string => {
  return user !== undefined && user.avatarPath !== null
    ? `${process.env.NEXT_PUBLIC_API_URL as string}/user/avatar/${user.id}`
    : '';
};
