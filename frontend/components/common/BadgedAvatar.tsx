import { Avatar, Badge } from '@mui/material';
import { UserStatus } from 'types/game';
import { ClientUser } from 'types/user';
import { useQueryClient } from '@tanstack/react-query';
import Debug from 'debug';
import { useState } from 'react';
import { StringAvatarStyle } from 'components/chat/utils/StringAvatarStyle';
import { AvatarFontSize } from 'types/utils';

type Props = {
  status?: UserStatus;
  width?: number;
  height?: number;
  src: string;
  displayName: string;
  avatarFontSize: AvatarFontSize;
};

const badgeStyle = {
  '& .MuiBadge-badge': {
    backgroundColor: '#9e9e9e',
  },
};

const getBadgeColor = (status: UserStatus) => {
  switch (status) {
    case UserStatus.ONLINE:
      return 'success';
    case UserStatus.PLAYING:
      return 'error';
    default:
      return 'default';
  }
};

export const BadgedAvatar = ({
  status,
  width,
  height,
  src,
  displayName,
  avatarFontSize,
}: Props) => {
  const debug = Debug('user');

  const queryClient = useQueryClient();

  const [isLoadingError, setIsLoadingError] = useState(false);

  const handleLoadingSuccess = () => {
    debug('handleLoadingSuccess');

    setIsLoadingError(false);
  };

  const handleLoadingError = () => {
    debug('handleLoadingError');

    setIsLoadingError(true);

    /**
     * この関数が呼ばれるタイミングは、getAvatarImageUrlの返り値のパスをAvatar
     * コンポーネントのsrcに設定した結果、何らかのエラーが発生した状態
     * そのような状態で、かつ、キャッシュされているユーザーのavatarPathがnullでない場合は
     * そのパスが不正な場合 (例えば、バックエンドに保存されているファイルが削除された場合)なので
     * キャッシュのavatarPathをundefinedに上書きする
     */

    // キャッシュされているユーザーデータを取得
    const cachedUserData = queryClient.getQueryData<ClientUser>(['user']);

    // avatarPathがnull出ない場合にはパスを削除
    if (cachedUserData && cachedUserData.avatarPath) {
      debug(`removeCachedAvatarPath: ${cachedUserData.avatarPath}`);

      cachedUserData.avatarPath = undefined;

      // avatarPathを削除したユーザーデータにキャッシュを更新
      queryClient.setQueryData(['user'], cachedUserData);
    }
  };

  return status ? (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent=""
      color={getBadgeColor(status)}
      sx={status === UserStatus.OFFLINE ? badgeStyle : undefined}
      title={status}
    >
      <Avatar
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...StringAvatarStyle(
          displayName,
          width,
          height,
          isLoadingError,
          avatarFontSize,
        )}
        src={src}
        imgProps={{ onLoad: handleLoadingSuccess, onError: handleLoadingError }}
      />
    </Badge>
  ) : (
    <Avatar
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...StringAvatarStyle(
        displayName,
        width,
        height,
        isLoadingError,
        avatarFontSize,
      )}
      src={src}
      /**
       * imgPropsを使うと、イベントに対応して発火する関数を設定できる
       * onLoad: Loadingが成功したときに発火する関数
       * onError: エラーのときに発火する関数
       * 参考: https://github.com/mui/material-ui/issues/11128
       */
      imgProps={{ onLoad: handleLoadingSuccess, onError: handleLoadingError }}
    />
  );
};
