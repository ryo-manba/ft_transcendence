import { Avatar } from '@mui/material';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';

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

export const MessageLeft = ({
  message,
  timestamp,
  displayName,
  userId,
}: Props) => {
  // 時間を表示用に変換する
  const displayTimestamp = truncateDate(new Date(timestamp));

  const avatarImageUrl = getAvatarImageUrl(userId);

  return (
    <>
      <div style={{ display: 'flex', margin: '10px' }}>
        <Avatar src={avatarImageUrl} />
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
