import { useState, memo, useEffect } from 'react';
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Box,
  Collapse,
  IconButton,
  Alert,
} from '@mui/material';
import { Friend } from 'types/friend';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendInfoDialog } from 'components/chat/friend/FriendInfoDialog';
import { Loading } from 'components/common/Loading';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { getUserStatusById } from 'api/user/getUserStatusById';
import { UserStatus } from '@prisma/client';
import CloseIcon from '@mui/icons-material/Close';
import { useSocketStore } from 'store/game/ClientSocket';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { useRouter } from 'next/router';
import { Invitation } from 'types/game';
import { BadgedAvatar } from 'components/common/BadgedAvatar';

type Props = {
  friend: Friend;
};

export const FriendListItem = memo(function FriendListItem({ friend }: Props) {
  const [open, setOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<UserStatus>('OFFLINE');
  const { data: user } = useQueryUser();
  const [error, setError] = useState('');
  const { socket: gameSocket } = useSocketStore();
  const updateInvitedFriendState = useInvitedFriendStateStore(
    (store) => store.updateInvitedFriendState,
  );
  const router = useRouter();

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

  const inviteFriend = (friend: Friend) => {
    const invitation: Invitation = {
      guestId: friend.id,
      hostId: user.id,
    };
    gameSocket.emit('inviteFriend', invitation, (res: boolean) => {
      // [TODO] ここで招待するユーザの正しいステータスを受け取りなおしてエラーをセットする。
      if (res) {
        updateInvitedFriendState({ friendId: friend.id });
        void router.push('game/home');
      } else {
        setError('You have already sent invitation now!');
      }
    });
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Collapse in={error !== ''}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setError('');
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        </Collapse>
      </Box>
      <ListItem divider button onClick={handleClickOpen}>
        <ListItemAvatar>
          <BadgedAvatar
            status={friendStatus}
            src={getAvatarImageUrl(friend.id)}
          />
        </ListItemAvatar>
        <ListItemText
          primary={friend.name}
          style={{
            overflow: 'hidden',
          }}
        />
      </ListItem>
      <FriendInfoDialog
        friend={friend}
        onClose={handleClose}
        open={open}
        inviteFriend={inviteFriend}
      />
    </>
  );
});
