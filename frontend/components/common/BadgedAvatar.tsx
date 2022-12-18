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

const getBadgeColor = (status: UserStatus) => {
  switch (status) {
    case 'ONLINE':
      return 'success';
    case 'PLAYING':
      return 'error';
    default:
      return 'default';
  }
};

export const BadgedAvatar = ({ status, width, height, src }: Props) => {
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent=""
      color={getBadgeColor(status)}
      sx={status === 'OFFLINE' ? badgeStyle : undefined}
      title={status}
    >
      <Avatar sx={{ width, height }} src={src} />
    </Badge>
  );
};
