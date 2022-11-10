import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Button } from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { LogoutIcon } from '@heroicons/react/solid';
import { Layout } from '../components/Layout';
import { useQueryClient } from '@tanstack/react-query';

const Dashboard: NextPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = async () => {
    queryClient.removeQueries(['tasks']);
    queryClient.removeQueries(['user']);
    if (process.env.NEXT_PUBLIC_API_URL) {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`);
      void router.push('/');
    }
  };

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
      <Layout title="Task Board">
        <LogoutIcon
          className="mb-6 h-6 w-6 cursor-pointer text-blue-500"
          onClick={() => {
            void logout();
          }}
        />
      </Layout>
    </div>
  );
};

export default Dashboard;