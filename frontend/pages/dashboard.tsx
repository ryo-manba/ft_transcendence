import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Button, Typography } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import { Header } from 'components/common/Header';
import { signOut, useSession } from 'next-auth/react';

const Dashboard: NextPage = () => {
  const { data: user } = useQueryUser();
  const { data: session } = useSession();

  console.log(session?.user);

  return (
    <div>
      <Header title="ft_transcendence" />
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
