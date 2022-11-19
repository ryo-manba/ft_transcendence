import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Button, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { LogoutIcon } from '@heroicons/react/solid';
import { Layout } from '../components/Layout';
import { useQueryClient } from '@tanstack/react-query';
import { useQueryUser } from 'hooks/useQueryUser';
import { signOut, useSession } from 'next-auth/react';

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
  const { data: user } = useQueryUser();
  const { data: session } = useSession();

  console.log(session?.user);

  return (
    <div>
      <Typography>HELLO {user?.name}</Typography>
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
        <p>Sign out for mail login</p>
        <LogoutIcon
          className="mb-6 h-6 w-6 cursor-pointer text-blue-500"
          onClick={() => {
            void logout();
          }}
        />
        <>
          {/* Signed in as <img src={session.user.image ?? ''} width="50px" />
            {session.user.name} <br />
            AccessToken : {session.accessToken} <br /> */}
          <button
            onClick={() => {
              void signOut(); //oauthのログアウト
              // void logout(); //backendへのログアウト
            }}
          >
            Sign out for oauth login
          </button>
        </>
      </Layout>
    </div>
  );
};

export default Dashboard;
