import { useState, memo, useEffect } from 'react';
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
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
import { MatchPair } from 'types/game';

type Props = {
  friend: Friend;
};

export const FriendListItem = memo(function FriendListItem({ friend }: Props) {
  const [open, setOpen] = useState(false);
  const [friendStatus, setFriendStatus] = useState<UserStatus>('OFFLINE');
  const { data: user } = useQueryUser();
  const [warningMessage, setWarningMessage] = useState('');
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
    const match: MatchPair = {
      invitee: friend,
      host: {
        name: user.name,
        id: user.id,
      },
    };
    gameSocket.emit('inviteFriend', match, (res: boolean) => {
      // [TODO] ここで招待するユーザの正しいステータスを受け取りなおす。
      if (res) {
        updateInvitedFriendState({ friend: friend, invitedFriend: true });
        void router.push('game/home');
      } else {
        setWarningMessage(`You already sent invitation to ${friend.name}`);
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
        <Collapse in={warningMessage !== ''}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setWarningMessage('');
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {warningMessage}
          </Alert>
        </Collapse>
      </Box>
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
      <FriendInfoDialog
        friend={friend}
        onClose={handleClose}
        open={open}
        inviteFriend={inviteFriend}
      />
    </>
  );
});
