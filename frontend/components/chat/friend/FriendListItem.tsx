import { useState, memo } from 'react';
import { ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { Friend } from 'types/friend';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendInfoDialog } from 'components/chat/friend/FriendInfoDialog';
import { Loading } from 'components/common/Loading';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';

type Props = {
  friend: Friend;
};

export const FriendListItem = memo(function FriendListItem({ friend }: Props) {
  const [open, setOpen] = useState(false);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

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
          <Avatar src={getAvatarImageUrl(friend.id)} />
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
