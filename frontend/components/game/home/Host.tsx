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
import { useMutationStatus } from 'hooks/useMutationStatus';
import ErrorIcon from '@mui/icons-material/Error';

export const Host = () => {
  const [invitationDenied, setInvitationDenied] = useState(false);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const router = useRouter();
  const { data: user } = useQueryUser();
  const { socket } = useSocketStore();
  const { invitedFriendState, updateInvitedFriendState } =
    useInvitedFriendStateStore();
  const { updateStatusMutation } = useMutationStatus();

  useEffect(() => {
    if (user === undefined) return;

    const updateStatusPlaying = () => {
      try {
        updateStatusMutation.mutate({
          userId: user.id,
          status: 'PLAYING',
        });
      } catch (error) {
        return;
      }
    };
    socket.on('select', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);
      updateInvitedFriendState({
        friendId: null,
      });

      updateStatusPlaying();
      void router.push('/game/battle');
    });
    socket.on('standBy', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);
      updateInvitedFriendState({
        friendId: null,
      });

      updateStatusPlaying();
      void router.push('/game/battle');
    });
    socket.on('denyInvitation', () => {
      // InvitedFriendStateの変更はcancelInvitationにて行う。
      setInvitationDenied(true);
    });

    return () => {
      socket.off('select');
      socket.off('standBy');
      socket.off('denyInvitation');
    };
  });

  const cancelInvitation = useCallback(() => {
    if (invitedFriendState.friendId !== null && user !== undefined) {
      const invitation: Invitation = {
        guestId: invitedFriendState.friendId,
        hostId: user.id,
      };

      socket.emit('cancelInvitation', invitation);
      updateInvitedFriendState({ friendId: null });
    }
  }, [user]);

  useEffect(() => {
    router.events.on('routeChangeStart', cancelInvitation);

    return () => {
      router.events.off('routeChangeStart', cancelInvitation);
    };
  });

  return (
    <Modal
      open={invitedFriendState.friendId !== null}
      aria-labelledby="modal-modal-title"
    >
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
        {invitationDenied ? (
          <>
            <Grid>
              <ErrorIcon fontSize="large" />
            </Grid>
            <Grid item sx={{ mt: 1 }}>
              <Typography
                variant="h6"
                id="modal-modal-title"
                align="center"
                gutterBottom
              >
                Invitation was denied...
              </Typography>
            </Grid>
          </>
        ) : (
          <>
            <Grid item>
              <CircularProgress />
            </Grid>
            <Grid item sx={{ mt: 2 }}>
              <Typography
                variant="h6"
                id="modal-modal-title"
                align="center"
                gutterBottom
              >
                Waiting for Opponent...
              </Typography>
            </Grid>
          </>
        )}
        <Grid item>
          <Button onClick={cancelInvitation}>cancel</Button>
        </Grid>
      </Grid>
    </Modal>
  );
};
