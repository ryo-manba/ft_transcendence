import { Grid } from '@mui/material';
import { useEffect } from 'react';
import {
  usePlayStateStore,
  stateNothing,
  stateWaiting,
  statePlaying,
  stateWinner,
  stateLoser,
} from 'store/game/home/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { Start } from './Start';
import { Play } from './Play';
import { Wait } from './Wait';
import { Watch } from './Watch';
import { Winner } from './Winner';
import { Loser } from './Loser';

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
      direction="column"
    >
      <Grid item xs={30}>
        <h1 style={{ textAlign: 'center' }}>WebSocket Sample App</h1>
      </Grid>
      {playState === stateNothing && <Start />}
      {playState === stateWaiting && <Wait />}
      {playState === statePlaying && <Play />}
      {playState === stateWinner && <Winner />}
      {playState === stateLoser && <Loser />}
      <Watch />
    </Grid>
  );
};
