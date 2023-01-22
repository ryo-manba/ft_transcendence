import { useState, memo, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/router';
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Box,
  Collapse,
} from '@mui/material';
import { Socket } from 'socket.io-client';
import Debug from 'debug';
import { UserStatus } from '@prisma/client';
import { Invitation } from 'types/game';
import { Friend } from 'types/friend';
import { Chatroom, CurrentRoom } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { useSocketStore } from 'store/game/ClientSocket';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { getUserStatusById } from 'api/user/getUserStatusById';
import { FriendInfoDialog } from 'components/chat/friend/FriendInfoDialog';
import { Loading } from 'components/common/Loading';
import { BadgedAvatar } from 'components/common/BadgedAvatar';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';

type Props = {
  friend: Friend;
  socket: Socket;
  setCurrentRoom: Dispatch<SetStateAction<CurrentRoom | undefined>>;
};

export const FriendListItem = memo(function FriendListItem({
  friend,
  socket,
  setCurrentRoom,
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
        setError('You already started to play/prepare game');
      }
    });
  };

  const directMessage = (friend: Friend) => {
    const DMInfo = {
      senderId: user.id,
      recipientId: friend.id,
      senderName: user.name,
      recipientName: friend.name,
    };
    socket.emit(
      'chat:directMessage',
      DMInfo,
      (res: { chatroom: Chatroom | undefined }) => {
        debug('chat:directMessage %o', res);
        if (!res.chatroom) {
          setError('Failed to start direct messages.');

          return;
        }

        const newCurrentRoom: CurrentRoom = {
          id: res.chatroom.id,
          name: res.chatroom.name,
        };
        setCurrentRoom(newCurrentRoom);
      },
    );
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
