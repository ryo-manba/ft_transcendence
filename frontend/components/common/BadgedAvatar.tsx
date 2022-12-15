import { Avatar, Badge } from '@mui/material';
import { UserStatus } from '@prisma/client';

type Props = {
  status: UserStatus;
  width?: number;
  height?: number;
  src: string;
};

const badgeStyle = {
  '& .MuiBadge-badge': {
    backgroundColor: '#9e9e9e',
  },
};

export const BadgedAvatar = ({ status, width, height, src }: Props) => {
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent=""
      color={
        status === 'ONLINE'
          ? 'success'
          : status === 'PLAYING'
          ? 'error'
          : 'default'
      }
      sx={status === 'OFFLINE' ? badgeStyle : undefined}
      title={status}
    >
      <Avatar sx={{ width, height }} src={src} />
    </Badge>
  );
};
