import { useState, memo, useEffect } from 'react';
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Box,
  Collapse,
} from '@mui/material';
import { Socket } from 'socket.io-client';
import { Friend } from 'types/friend';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendInfoDialog } from 'components/chat/friend/FriendInfoDialog';
import { Loading } from 'components/common/Loading';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { getUserStatusById } from 'api/user/getUserStatusById';
import { UserStatus } from '@prisma/client';
import { useSocketStore } from 'store/game/ClientSocket';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { useRouter } from 'next/router';
import { Invitation } from 'types/game';
import { BadgedAvatar } from 'components/common/BadgedAvatar';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import Debug from 'debug';

type Props = {
  friend: Friend;
  socket: Socket;
};

export const FriendListItem = memo(function FriendListItem({
  friend,
  socket,
}: Props) {
  const debug = Debug('friend');
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
    let ignore = false;

    const updateStatus = async (ignore: boolean) => {
      const fetchedStatus = await getUserStatusById({ userId: friend.id });
      if (!ignore) {
        setFriendStatus(fetchedStatus);
      }
    };

    updateStatus(ignore).catch((err) => {
      debug(err);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const inviteGame = async (friend: Friend) => {
    // 最新のユーザ状態を取り直す
    const status = await getUserStatusById({ userId: friend.id });
    if (status !== friendStatus) {
      setFriendStatus(status);
    }
    if (status !== UserStatus.ONLINE) {
      setError(`${friend.name} is now ${status}`);

      return;
    }

    const invitation: Invitation = {
      guestId: friend.id,
      hostId: user.id,
    };

    gameSocket.emit('inviteFriend', invitation, (res: boolean) => {
      if (res) {
        updateInvitedFriendState({ friendId: friend.id });
        void router.push('game/home');
      } else {
        setError('You have already sent invitation now!');
      }
    });
  };

  const directMessage = (friend: Friend) => {
    const DMInfo = {
      userId1: user.id,
      userId2: friend.id,
      name1: user.name,
      name2: friend.name,
    };
    socket.emit('chat:directMessage', DMInfo, (res: boolean) => {
      debug('directMessage: ', res);
      if (!res) {
        setError('Failed to start direct messages.');

        return;
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
          <ChatErrorAlert error={error} setError={setError} />
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
        inviteGame={inviteGame}
        directMessage={directMessage}
      />
    </>
  );
});
