import { CircularProgress, Grid } from '@mui/material';
import { useEffect } from 'react';
import { usePlayStateStore, statePlaying } from 'store/game/home/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';

export const Wait = () => {
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);

  useEffect(() => {
    socket?.on('playStarted', () => {
      updatePlayState(statePlaying);
    });

    return () => {
      socket?.off('playStarted');
    };
  }, [socket]);

  return (
    <Grid item>
      <CircularProgress />
      <p>
        <b>Loading...</b>
      </p>
    </Grid>
  );
};
