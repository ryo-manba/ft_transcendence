import { v4 as uuidv4 } from 'uuid';

export const getAvatarImageUrl = (userId: number | undefined): string => {
  // uniqueSuffixをつけないと、Avatarを更新した際にもsrcのURLが全く同一になってしまうため
  // コンポーネントが再描画されなくなってしまう
  const uniqueSuffix: string = uuidv4();

  return userId !== undefined
    ? `${
        process.env.NEXT_PUBLIC_API_URL as string
      }/user/avatar/${userId}/${uniqueSuffix}`
    : '';
};
