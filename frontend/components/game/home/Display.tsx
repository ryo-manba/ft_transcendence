import { Grid, Paper } from '@mui/material';
import { useEffect } from 'react';
import {
  usePlayStateStore,
  stateNothing,
  stateWaiting,
  statePlaying,
} from 'store/game/home/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { Start } from './Start';
import { Play } from './Play';
import { Wait } from './Wait';
import { Watch } from './Watch';
import { History } from './History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export const Display = () => {
  const { socket, updateSocket } = useSocketStore();
  const { playState } = usePlayStateStore();

  useEffect(() => {
    updateSocket('ws://localhost:3001/game');

    return () => {
      socket?.disconnect();
    };
  }, []);

  return (
    <Grid
      container
      alignItems="center"
      justifyContent="center"
      direction="row"
      spacing={2}
    >
      <Grid item xs={10}>
        <h2 style={{ textAlign: 'center' }}>WebSocket Sample App</h2>
      </Grid>
      <Grid item xs={5}>
        <Paper elevation={2}>
          <EmojiEventsIcon
            sx={{
              width: '100%',
              height: '100%',
            }}
          />
        </Paper>
      </Grid>
      <Grid item xs={5}>
        <Paper elevation={2}>
          <Grid
            container
            alignItems="center"
            justifyContent="center"
            direction="column"
          >
            {playState === stateNothing && <Start />}
            {playState === stateWaiting && <Wait />}
            {playState === statePlaying && <Play />}
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={5}>
        <Paper elevation={2}>
          <History />
        </Paper>
      </Grid>
      <Grid item xs={5}>
        <Paper elevation={2}>
          <Watch />
        </Paper>
      </Grid>
    </Grid>
  );
};
