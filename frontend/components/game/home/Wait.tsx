import { CircularProgress, Grid } from '@mui/material';
import { useEffect } from 'react';
import { usePlayStateStore, statePlaying } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayerNamesStore } from 'store/game/PlayerName';
import { useRouter } from 'next/router';

export const Wait = () => {
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
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
      <CircularProgress />
      <p>
        <b>Loading...</b>
      </p>
    </Grid>
  );
};
