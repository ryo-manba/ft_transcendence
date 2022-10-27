import { CircularProgress, Grid } from '@mui/material';
import { useContext, useEffect } from 'react';
import {
  usePlayStateStore,
  statePlaying,
} from '../../../store/game/home/PlayState';
import { Context } from './Display';

export const Wait = () => {
  const clientSocket = useContext(Context);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);

  useEffect(() => {
    clientSocket.socket?.on('playStarted', () => {
      updatePlayState(statePlaying);
    });
  }, [clientSocket.socket]);

  return (
    <Grid item>
      <CircularProgress />
      <p>
        <b>Loading...</b>
      </p>
    </Grid>
  );
};
