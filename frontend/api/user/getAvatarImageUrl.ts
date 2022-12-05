export const getAvatarImageUrl = (userId: number | undefined): string => {
  return userId !== undefined
    ? `${process.env.NEXT_PUBLIC_API_URL as string}/user/avatar/${userId}`
    : '';
};
