import { AvatarFontSize } from 'types/utils';

/**
 * DOCS: https://mui.com/material-ui/react-avatar/#letter-avatars
 * 名前によって背景色を変更する
 */
const stringToColor = (string: string, isLoadingError: boolean) => {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return isLoadingError ? color : '';
};

/**
 * イメージソースが読み込めない場合 (=Avatarがアップロードされていない場合)のみ
 * bgcolorを変えるようにしないと、Avatarがある場合にもbgcolorが変わってしまう
 * ため、isLoadingErrorを引数に追加
 *
 * fontSizeについては下記の通り設定
 * - profile, setting: 5rem
 * - game/profile: 3rem
 * - その他: 1.5rem
 */
export const StringAvatarStyle = (
  name: string,
  width: number | undefined,
  height: number | undefined,
  isLoadingError: boolean,
  avatarFontSize: AvatarFontSize,
) => {
  return {
    sx: {
      bgcolor: stringToColor(name, isLoadingError),
      width,
      height,
      fontSize: avatarFontSize,
    },
    children: name[0],
  };
};
