import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Button } from '@mui/material';

const Home: NextPage = () => {
  return (
    <div>
      <Stack spacing={2} direction="row">
        <Link href="/chat">
          <Button variant="contained">Chat</Button>
        </Link>
        <Link href="/game/home">
          <Button variant="contained">Game</Button>
        </Link>
        <Link href="/friend">
          <Button variant="contained">Friend</Button>
        </Link>
      </Stack>
    </div>
  );
};

export default Home;
