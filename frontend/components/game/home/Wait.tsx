import { CircularProgress, Grid } from '@mui/material';
import { useEffect } from 'react';
import { usePlayStateStore, statePlaying } from 'store/game/home/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayerNamesStore } from 'store/game/home/PlayerName';

export const Wait = () => {
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );

  useEffect(() => {
    socket?.on('playStarted', (playerNames: [string, string]) => {
      updatePlayState(statePlaying);
      updatePlayerNames(playerNames);
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
