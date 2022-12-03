import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Typography, Paper, Grid, Button } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { Loading } from 'components/common/Loading';
import ChatIcon from '@mui/icons-material/Chat';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import { useState } from 'react';

const Dashboard: NextPage = () => {
  const { data: user } = useQueryUser();
  const overElavation = 7;
  const outElevation = 2;
  const [chatShadow, setChatShadow] = useState(outElevation);
  const [gameShadow, setGameShadow] = useState(outElevation);
  const [friendShadow, setFriendShadow] = useState(outElevation);

  if (user === undefined) return <Loading fullHeight />;

  return (
    <Layout title="Dashboard">
      <Header title="ft_transcendence" />
      <Typography variant="h3" gutterBottom sx={{ margin: '50px' }}>
        HELLO {user.name}
      </Typography>
      <Stack
        spacing={6}
        direction="row"
        justifyContent="space-evenly"
        alignItems="center"
        sx={{ height: '100%', mt: '50px' }}
      >
        <Link href="/chat">
          <Button>
            <Paper
              sx={{
                width: '200px',
                height: '200px',
                bgcolor: 'primary.main',
                color: 'white',
              }}
              elevation={chatShadow}
              onMouseOver={() => {
                setChatShadow(overElavation);
              }}
              onMouseOut={() => {
                setChatShadow(outElevation);
              }}
            >
              <Grid
                container
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{
                  height: '100%',
                }}
              >
                <Grid item>
                  <Typography fontWeight="fontWeightBold" variant="h5">
                    Chat
                  </Typography>
                </Grid>
                <Grid item>
                  <ChatIcon />
                </Grid>
              </Grid>
            </Paper>
          </Button>
        </Link>
        <Link href="/game/home">
          <Button>
            <Paper
              sx={{
                width: '200px',
                height: '200px',
                bgcolor: 'primary.main',
                color: 'white',
              }}
              elevation={gameShadow}
              onMouseOver={() => {
                setGameShadow(overElavation);
              }}
              onMouseOut={() => {
                setGameShadow(outElevation);
              }}
            >
              <Grid
                container
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{ height: '100%' }}
              >
                <Grid item>
                  <Typography fontWeight="fontWeightBold" variant="h5">
                    Game
                  </Typography>
                </Grid>
                <Grid item>
                  <VideogameAssetIcon />
                </Grid>
              </Grid>
            </Paper>
          </Button>
        </Link>
        <Link href="/friend">
          <Button>
            <Paper
              sx={{
                width: '200px',
                height: '200px',
                bgcolor: 'primary.main',
                color: 'white',
              }}
              elevation={friendShadow}
              onMouseOver={() => {
                setFriendShadow(overElavation);
              }}
              onMouseOut={() => {
                setFriendShadow(outElevation);
              }}
            >
              <Grid
                container
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{ height: '100%' }}
              >
                <Grid item>
                  <Typography fontWeight="fontWeightBold" variant="h5">
                    Friend
                  </Typography>
                </Grid>
                <Grid item>
                  <Diversity3Icon />
                </Grid>
              </Grid>
            </Paper>
          </Button>
        </Link>
      </Stack>
    </Layout>
  );
};

export default Dashboard;
