import { useState, memo, useEffect } from 'react';
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
} from '@mui/material';
import { Friend } from 'types/friend';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendInfoDialog } from 'components/chat/friend/FriendInfoDialog';
import { Loading } from 'components/common/Loading';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { getUserStatusById } from 'api/user/getUserStatusById';
import { UserStatus } from '@prisma/client';

type Props = {
  friend: Friend;
};

export const FriendListItem = memo(function FriendListItem({ friend }: Props) {
  const [open, setOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<UserStatus>('OFFLINE');
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  useEffect(() => {
    const updateStatus = async () => {
      const fetchedStatus = await getUserStatusById({ userId: friend.id });
      console.log(fetchedStatus);
      setFriendStatus(fetchedStatus);
    };

    updateStatus().catch((err) => {
      console.error(err);
    });
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <ListItem divider button onClick={handleClickOpen}>
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent=""
            color={
              friendStatus === 'ONLINE'
                ? 'success'
                : friendStatus === 'PLAYING'
                ? 'error'
                : 'default'
            }
          >
            <Avatar src={getAvatarImageUrl(friend.id)} />
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={friend.name}
          style={{
            overflow: 'hidden',
          }}
        />
      </ListItem>
      <FriendInfoDialog friend={friend} onClose={handleClose} open={open} />
    </>
  );
});
