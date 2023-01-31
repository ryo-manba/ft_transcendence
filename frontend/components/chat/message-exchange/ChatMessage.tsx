import { Avatar } from '@mui/material';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { useState } from 'react';

type Props = {
  message: string;
  timestamp: Date;
  displayName: string;
  userId: number;
};

/**
 * Dateオブジェクトを次の形式に変換する
 * 2023/01/01 12:00
 */
const truncateDate = (date: Date): string => {
  const res = date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return res;
};

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
 */
const stringAvatar = (name: string, isLoadingError: boolean) => {
  return {
    sx: {
      bgcolor: stringToColor(name, isLoadingError),
    },
    children: name[0],
  };
};

export const MessageLeft = ({
  message,
  timestamp,
  displayName,
  userId,
}: Props) => {
  // 時間を表示用に変換する
  const displayTimestamp = truncateDate(new Date(timestamp));

  const avatarImageUrl = getAvatarImageUrl(userId);

  const [isLoadingError, setIsLoadingError] = useState(false);

  const handleLoadingError = () => {
    setIsLoadingError(true);
  };

  return (
    <>
      <div style={{ display: 'flex', margin: '10px' }}>
        <Avatar
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...stringAvatar(displayName, isLoadingError)}
          src={avatarImageUrl}
          // imgPropsを使うと、エラーが起きたときに発火する関数を設定できる
          // 参考: https://github.com/mui/material-ui/issues/11128
          imgProps={{ onError: handleLoadingError }}
        />
        <div>
          <div
            style={{
              marginLeft: '20px',
              fontSize: '12px',
              color: 'silver',
            }}
          >
            {`${displayName} ${displayTimestamp}`}
          </div>
          <div>
            <p
              style={{
                marginLeft: '20px',
                marginTop: '0px',
                marginBottom: '0px',
                paddingTop: '5px',
                paddingBottom: '5px',
              }}
            >
              {message}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
