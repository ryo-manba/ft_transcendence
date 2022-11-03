import {
  CircularProgress,
  Grid,
  Modal,
  Typography,
  Button,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  usePlayStateStore,
  statePlaying,
  stateNothing,
  stateWaiting,
} from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayerNamesStore } from 'store/game/PlayerName';
import { useRouter } from 'next/router';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

export const Wait = () => {
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { playState } = usePlayStateStore();
  const [open, setOpen] = useState(true);
  const { socket } = useSocketStore();

  const handleClose = () => {
    setOpen(false);
    updatePlayState(stateNothing);
    socket?.emit('playCancel');
  };
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );

  const router = useRouter();
  useEffect(() => {
    socket?.on('playStarted', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(statePlaying);
      void router.push('/game/play');
    });

    return () => {
      socket?.off('playStarted');
    };
  }, [socket]);

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
            width: '25%',
            height: '25%',
          }}
        >
          <Grid item>
            {playState === stateWaiting ? (
              <CircularProgress />
            ) : (
              <DoneOutlineIcon />
            )}
          </Grid>
          <Grid item sx={{ mt: 1, mb: 1 }}>
            <Typography id="modal-modal-title" align="center" fontSize="1.2rem">
              Waiting for Opponent...
            </Typography>
          </Grid>
          <Grid item>
            <Button disabled={playState !== stateWaiting} onClick={handleClose}>
              cancel
            </Button>
          </Grid>
        </Grid>
      </Modal>
    </Grid>
  );
};

{
  /* <Box sx={{
  margin: 'auto',
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '30%',
  height: '20%',
  bgcolor: 'background.paper',
  textAlign: 'center'
}}> */
}
