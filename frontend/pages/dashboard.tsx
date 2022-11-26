import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Button, Typography } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import { Header } from 'components/common/Header';
import { useSession } from 'next-auth/react';
import { Layout } from 'components/common/Layout';

const Dashboard: NextPage = () => {
  const { data: user } = useQueryUser();
  const { data: session } = useSession();

  console.log(session?.user);

  if (user === undefined) return <></>;

  return (
    <Layout title="Dashboard">
      <Header title="ft_transcendence" />
      <Typography>HELLO {user.name}</Typography>
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
    </Layout>
  );
};

export default Dashboard;
