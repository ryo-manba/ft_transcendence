import { Avatar } from '@mui/material';

type Props = {
  message: string;
  timestamp: Date;
  displayName: string;
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
const stringToColor = (string: string) => {
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

  return color;
};

const stringAvatar = (name: string) => {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: name[0],
  };
};

export const MessageLeft = ({ message, timestamp, displayName }: Props) => {
  // 時間を表示用に変換する
  const displayTimestamp = truncateDate(new Date(timestamp));

  return (
    <>
      <div style={{ display: 'flex', margin: '10px' }}>
        <Avatar
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...stringAvatar(displayName)}
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
