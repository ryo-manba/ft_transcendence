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
import ErrorIcon from '@mui/icons-material/Error';

type Props = {
  openMatchError: boolean;
};

export const Wait = ({ openMatchError }: Props) => {
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
  }, [playState, socket, updatePlayState]);

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
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);

      updateUserStatusPlaying();
      void router.push('/game/battle');
    });
    socket.on('random:standBy', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);

      updateUserStatusPlaying();
      void router.push('/game/battle');
    });

    return () => {
      socket.off('random:select');
      socket.off('random:standBy');
    };
  }, [
    socket,
    user,
    router,
    updatePlayState,
    updatePlayerNames,
    updateStatusMutation,
  ]);

  useEffect(() => {
    router.events.on('routeChangeStart', cancelPlay);

    return () => {
      router.events.off('routeChangeStart', cancelPlay);
    };
  }, [cancelPlay, router.events]);

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
            {playState === PlayState.stateWaiting && !openMatchError && (
              <CircularProgress />
            )}
            {playState === PlayState.stateWaiting && openMatchError && (
              <ErrorIcon fontSize="large" />
            )}
            {playState !== PlayState.stateWaiting && <DoneOutlineIcon />}
          </Grid>
          <Grid item sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              id="modal-modal-title"
              align="center"
              gutterBottom
            >
              {playState === PlayState.stateWaiting &&
                !openMatchError &&
                'Waiting for Opponent'}
              {playState === PlayState.stateWaiting &&
                openMatchError &&
                'You already started to play/prepare game'}
              {playState !== PlayState.stateWaiting && 'Wait a Minute'}
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
