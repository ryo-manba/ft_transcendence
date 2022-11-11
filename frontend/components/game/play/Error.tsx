import Link from 'next/link';
import { Button } from '@mui/material';

export const Error = () => {
  return (
    <div>
      <h1>Something went wrong...</h1>
      <Link href="/game/home">
        <Button variant="contained">Back to Home</Button>
      </Link>
    </div>
  );
};
