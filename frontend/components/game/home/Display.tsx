import { Grid, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { Start } from './Start';
import { Wait } from './Wait';
import { Watch } from './Watch';
import { History } from './History';

export const Display = () => {
  const { socket } = useSocketStore();
  const { playState } = usePlayStateStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);

  useEffect(() => {
    socket.connect();
    updatePlayState(PlayState.stateNothing);

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="stretch"
        direction="row"
        spacing={4}
        sx={{ mt: 1 }}
      >
        <Grid item xs={5}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Typography variant="h2" align="center" gutterBottom>
              Profile
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={5}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Grid
              container
              alignItems="center"
              justifyContent="center"
              direction="column"
            >
              {playState === PlayState.stateNothing && <Start />}
              {(playState === PlayState.stateWaiting ||
                playState === PlayState.statePlaying) && <Wait />}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={5}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <History />
          </Paper>
        </Grid>
        <Grid item xs={5}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Watch />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};
