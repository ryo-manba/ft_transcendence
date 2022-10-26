import { Grid } from '@mui/material';
import { createContext, useMemo, useEffect } from 'react';
import usePlayStateStore, {
  stateNothing,
  stateWaiting,
  statePlaying,
} from '../../../store/game/home/PlayState';
import ClientSocket from '../../../store/game/ClientSocket';
import Start from './Start';
import Play from './Play';
import Wait from './Wait';
import Watch from './Watch';

export const Context = createContext({} as ClientSocket);

const Display = () => {
  const clientSocket = useMemo(() => {
    return new ClientSocket('ws://localhost:3001/game');
  }, []);
  const { playState } = usePlayStateStore();

  useEffect(() => {
    clientSocket.connect();
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
      <Context.Provider value={clientSocket}>
        {playState === stateNothing && <Start />}
        {playState === stateWaiting && <Wait />}
        {playState === statePlaying && <Play />}
        <Watch />
      </Context.Provider>
    </Grid>
  );
};

export default Display;