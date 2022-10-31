import React from 'react';
import Link from 'next/link';
import { Button } from '@mui/material';
import { usePlayStateStore, stateNothing } from 'store/game/home/PlayState';

export const Loser = () => {
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const onClick = () => {
    updatePlayState(stateNothing);
  };

  return (
    <div>
      <h1>You lose...</h1>
      <Link href="/">
        <Button variant="contained" onClick={onClick}>
          Back to Home
        </Button>
      </Link>
    </div>
  );
};
