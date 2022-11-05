import React from 'react';
import Link from 'next/link';
import { Button } from '@mui/material';
import { usePlayStateStore, stateNothing } from 'store/game/PlayState';

export const Error = () => {
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const onClick = () => {
    updatePlayState(stateNothing);
  };

  return (
    <div>
      <h1>Something went wrong...</h1>
      <Link href="/game/home">
        <Button variant="contained" onClick={onClick}>
          Back to Home
        </Button>
      </Link>
    </div>
  );
};
