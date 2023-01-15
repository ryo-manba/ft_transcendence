import {
  CircularProgress,
  Grid,
  Modal,
  Typography,
  Button,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { useRouter } from 'next/router';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import { useMutationStatus } from 'hooks/useMutationStatus';
import { useQueryUser } from 'hooks/useQueryUser';

export const Wait = () => {
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { playState } = usePlayStateStore();
  const [open, setOpen] = useState(true);
  const { socket } = useSocketStore();
  const { data: user } = useQueryUser();
  const { updateStatusMutation } = useMutationStatus();

  const cancelPlay = useCallback(() => {
    if (playState === PlayState.statePlaying) return;
    setOpen(false);
    updatePlayState(PlayState.stateNothing);
    socket.emit('playCancel');
  }, []);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );

  const router = useRouter();
  useEffect(() => {
    if (user === undefined) return;
    const updateUserStatusPlaying = () => {
      try {
        updateStatusMutation.mutate({
          userId: user.id,
          status: 'PLAYING',
        });
      } catch (error) {
        return;
      }
    };
    socket.on('random:select', (playerNames: [string, string]) => {
      console.log('HELLO');
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);

      updateUserStatusPlaying();
      void router.push('/game/battle');
    });
    socket.on('random:standBy', (playerNames: [string, string]) => {
      console.log('HELLO');
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);

      updateUserStatusPlaying();
      void router.push('/game/battle');
    });

    return () => {
      socket.off('random:select');
      socket.off('random:standBy');
    };
  }, [socket, user]);

  useEffect(() => {
    router.events.on('routeChangeStart', cancelPlay);

    return () => {
      router.events.off('routeChangeStart', cancelPlay);
    };
  });

  return (
    <Grid item>
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
            width: '270px',
            height: '180px',
            borderRadius: '5px',
          }}
        >
          <Grid item>
            {playState === PlayState.stateWaiting ? (
              <CircularProgress />
            ) : (
              <DoneOutlineIcon />
            )}
          </Grid>
          <Grid item sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              id="modal-modal-title"
              align="center"
              gutterBottom
            >
              {playState === PlayState.stateWaiting
                ? 'Waiting for Opponent...'
                : 'Wait a Minute...'}
            </Typography>
          </Grid>
          {playState === PlayState.stateWaiting && (
            <Grid item>
              <Button
                disabled={playState !== PlayState.stateWaiting}
                onClick={cancelPlay}
              >
                cancel
              </Button>
            </Grid>
          )}
        </Grid>
      </Modal>
    </Grid>
  );
};
