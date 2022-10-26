import type { NextPage } from 'next';
// import Head from 'next/head';
// import Image from 'next/image';
// import styles from '../styles/Home.module.css';
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
