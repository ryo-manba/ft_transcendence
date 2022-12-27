import { Avatar } from '@mui/material';

type Props = {
  message: string;
  timestamp: string;
  photoURL: string;
  displayName: string;
};

//avatarが左にあるメッセージ（他人）
export const MessageLeft = (props: Props) => {
  const message = props.message ? props.message : 'no message';
  const timestamp = props.timestamp ? props.timestamp : '';
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
            {displayName}+{timestamp}
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
