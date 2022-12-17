import {
  CircularProgress,
  Grid,
  Modal,
  Typography,
  Button,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useRouter } from 'next/router';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { Invitation } from 'types/game';
import { useQueryUser } from 'hooks/useQueryUser';

export const Host = () => {
  const [open, setOpen] = useState(true);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );

  const router = useRouter();
  const { data: user } = useQueryUser();
  const { socket } = useSocketStore();
  const { invitedFriendState, updateInvitedFriendState } =
    useInvitedFriendStateStore();

  useEffect(() => {
    socket.on('select', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);
      updateInvitedFriendState({
        friendId: null,
      });
      setOpen(false);

      void router.push('/game/battle');
    });
    socket.on('standBy', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);
      updateInvitedFriendState({
        friendId: null,
      });
      setOpen(false);

      void router.push('/game/battle');
    });

    return () => {
      socket.off('select');
      socket.off('standBy');
    };
  });

  const routeChangeHandler = useCallback(() => {
    if (invitedFriendState.friendId !== null && user !== undefined) {
      const invitation: Invitation = {
        guestId: invitedFriendState.friendId,
        hostId: user.id,
      };

      socket.emit('cancelInvitation', invitation);
    }
  }, [user]);

  useEffect(() => {
    router.events.on('routeChangeStart', routeChangeHandler);

    return () => {
      router.events.off('routeChangeStart', routeChangeHandler);
    };
  });

  if (user === undefined) return <></>;

  const handleClose = useCallback(() => {
    if (invitedFriendState.friendId !== null) {
      const invitation: Invitation = {
        guestId: invitedFriendState.friendId,
        hostId: user.id,
      };

      socket.emit('cancelInvitation', invitation);
      updateInvitedFriendState({ friendId: null });
      setOpen(false);
    }
  }, []);

  return (
    <Modal open={open} aria-labelledby="modal-modal-title">
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        direction="column"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          width: '25%',
          height: '25%',
        }}
      >
        <Grid item>
          <CircularProgress />
        </Grid>
        <Grid item sx={{ mt: 1 }}>
          <Typography
            variant="h6"
            id="modal-modal-title"
            align="center"
            gutterBottom
          >
            Waiting for Opponent...
          </Typography>
        </Grid>
        <Grid item>
          <Button onClick={handleClose}>cancel</Button>
        </Grid>
      </Grid>
    </Modal>
  );
};
