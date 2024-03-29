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
import ErrorIcon from '@mui/icons-material/Error';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

export const Host = () => {
  const [invitationDenied, setInvitationDenied] = useState(false);
  const { playState, updatePlayState } = usePlayStateStore();
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const router = useRouter();
  const { data: user } = useQueryUser();
  const { socket } = useSocketStore();
  const { invitedFriendState, updateInvitedFriendState } =
    useInvitedFriendStateStore();

  useEffect(() => {
    if (user === undefined) return;

    socket.on('friend:select', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);
      updateInvitedFriendState({
        friendId: null,
      });

      void router.push('/game/battle');
    });
    socket.on('friend:standBy', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);
      updateInvitedFriendState({
        friendId: null,
      });

      void router.push('/game/battle');
    });
    socket.on('denyInvitation', () => {
      // InvitedFriendStateの変更はcancelInvitationにて行う。
      setInvitationDenied(true);
    });

    return () => {
      socket.off('friend:select');
      socket.off('friend:standBy');
      socket.off('denyInvitation');
    };
  }, [
    user,
    socket,
    router,
    updateInvitedFriendState,
    updatePlayState,
    updatePlayerNames,
  ]);

  const cancelInvitation = useCallback(() => {
    if (invitedFriendState.friendId !== null && user !== undefined) {
      const invitation: Invitation = {
        guestId: invitedFriendState.friendId,
        hostId: user.id,
      };

      socket.emit('cancelInvitation', invitation);
      updateInvitedFriendState({ friendId: null });
    }
  }, [user, invitedFriendState.friendId, socket, updateInvitedFriendState]);

  useEffect(() => {
    router.events.on('routeChangeStart', cancelInvitation);

    return () => {
      router.events.off('routeChangeStart', cancelInvitation);
    };
  }, [cancelInvitation, router.events]);

  return (
    <Modal open={true} aria-labelledby="modal-modal-title">
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
          width: '270px',
          height: '180px',
          borderRadius: '5px',
        }}
      >
        <>
          <Grid>
            {invitationDenied && <ErrorIcon fontSize="large" />}
            {playState !== PlayState.stateNothing && <DoneOutlineIcon />}
            {playState === PlayState.stateNothing && !invitationDenied && (
              <CircularProgress />
            )}
          </Grid>
          <Grid item sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              id="modal-modal-title"
              align="center"
              gutterBottom
            >
              {invitationDenied && 'Invitation was denied'}
              {playState !== PlayState.stateNothing && 'Wait a Minute'}
              {playState === PlayState.stateNothing &&
                !invitationDenied &&
                'Waiting for Opponent'}
            </Typography>
          </Grid>
        </>
        <Grid item>
          <Button onClick={cancelInvitation}>
            {invitationDenied ? 'close' : 'cancel'}
          </Button>
        </Grid>
      </Grid>
    </Modal>
  );
};
