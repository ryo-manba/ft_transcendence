import { Avatar } from '@mui/material';

type Props = {
  message: string;
  timestamp: Date;
  photoURL: string;
  displayName: string;
};

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

//avatarが左にあるメッセージ（他人）
export const MessageLeft = ({
  message,
  timestamp,
  photoURL,
  displayName,
}: Props) => {
  // 表示用に時間を変換する
  const displayTimestamp = truncateDate(new Date(timestamp));

  return (
    <>
      <div style={{ display: 'flex', margin: '10px' }}>
        <Avatar alt={displayName} src={photoURL}></Avatar>
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
