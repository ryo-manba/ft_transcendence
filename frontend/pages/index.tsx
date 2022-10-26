import type { NextPage } from 'next';
import { Stack, Button } from '@mui/material';

const Home: NextPage = () => {
  return (
    <div>
      <Stack spacing={2} direction="row">
        <Button variant="contained">Chat</Button>
        <Button variant="contained">Game</Button>
        <Button variant="contained">Friend</Button>
      </Stack>
    </div>
  );
};

export default Home;
