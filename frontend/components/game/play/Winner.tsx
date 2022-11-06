import React from 'react';
import Link from 'next/link';
import { Button } from '@mui/material';

export const Winner = () => {
  return (
    <div>
      <h1>You Win!</h1>
      <Link href="/game/home">
        <Button variant="contained">Back to Home</Button>
      </Link>
    </div>
  );
};
