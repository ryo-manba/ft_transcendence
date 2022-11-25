import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Button, Typography } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import { Header } from 'components/common/Header';
import { signOut } from 'next-auth/react';
import { Layout } from 'components/common/Layout';
import axios from 'axios';
import { LogoutIcon } from '@heroicons/react/solid';
import { useQueryClient } from '@tanstack/react-query';

const Dashboard: NextPage = () => {
  const { data: user } = useQueryUser();
  const queryClient = useQueryClient();
  const logout = async () => {
    queryClient.removeQueries(['user']);
    if (process.env.NEXT_PUBLIC_API_URL) {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`);
      void signOut({
        callbackUrl: 'http://localhost:3000/',
      });
    }
  };

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
      <p>Sign out for mail login</p>
      <LogoutIcon
        className="mb-6 h-6 w-6 cursor-pointer text-blue-500"
        onClick={() => {
          void logout();
        }}
      />
    </Layout>
  );
};

export default Dashboard;
