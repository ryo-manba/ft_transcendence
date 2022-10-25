import { CircularProgress, Grid } from '@mui/material';
import { useContext, useEffect } from 'react';
import useOpponentStore from '../store/Opponent';
import usePlayStateStore, { statePlaying } from '../store/PlayState';
import { Context } from './Display';

export const Wait = () => {
  const clientSocket = useContext(Context);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updateOpponent = useOpponentStore((store) => store.updateOpponent);

  useEffect(() => {
    clientSocket.socket?.on('playStarted', (arg: string) => {
      updatePlayState(statePlaying);
      updateOpponent(arg);
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
