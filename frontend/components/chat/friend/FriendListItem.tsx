import { useState, memo } from 'react';
import { ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { blue } from '@mui/material/colors';
import { Friend } from 'types/friend';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendInfoDialog } from 'components/chat/friend/FriendInfoDialog';
import { Loading } from 'components/common/Loading';

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
          <Avatar sx={{ bgcolor: blue[100], color: blue[600] }} />
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