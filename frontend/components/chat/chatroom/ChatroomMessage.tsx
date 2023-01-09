import { Avatar } from '@mui/material';

type Props = {
  message: string;
  timestamp: Date;
  photoURL: string;
  displayName: string;
};

const truncateDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const res = `${year}/${month}/${day} ${hour}:${minute}`;

  return res;
};

//avatarが左にあるメッセージ（他人）
export const MessageLeft = (props: Props) => {
  const message = props.message ? props.message : 'no message';
  const timestamp = props.timestamp
    ? truncateDate(new Date(props.timestamp))
    : '';
  // const timestamp = props.timestamp ? props.timestamp : '';
  const photoURL = props.photoURL ? props.photoURL : 'dummy.js';
  const displayName = props.displayName ? props.displayName : '名無しさん';

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
            {`${displayName} ${timestamp}`}
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
