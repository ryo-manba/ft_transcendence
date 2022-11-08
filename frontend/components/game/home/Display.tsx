import { Grid, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';
import {
  usePlayStateStore,
  stateNothing,
  stateWaiting,
  statePlaying,
} from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { Start } from './Start';
import { Wait } from './Wait';
import { Watch } from './Watch';
import { History } from './History';
import { Header } from 'components/common/Header';

export const Display = () => {
  const { socket, updateSocket } = useSocketStore();
  const { playState } = usePlayStateStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);

  useEffect(() => {
    updateSocket('ws://localhost:3001/game');
    updatePlayState(stateNothing);

    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <>
      <Header title="game" />
      <Grid
        container
        justifyContent="center"
        alignItems="stretch"
        direction="row"
        spacing={4}
        sx={{ mt: 1, height: 800 }}
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
              {playState === stateNothing && <Start />}
              {(playState === stateWaiting || playState === statePlaying) && (
                <Wait />
              )}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={5} sx={{ height: '50%' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <History />
          </Paper>
        </Grid>
        <Grid item xs={5} sx={{ height: '50%' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Watch />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};
