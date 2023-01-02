import type { NextPage } from 'next';
import Link from 'next/link';
import { Stack, Typography, Grid, Button } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { Loading } from 'components/common/Loading';
import ChatIcon from '@mui/icons-material/Chat';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';

const Dashboard: NextPage = () => {
  const { data: user } = useQueryUser();

  if (user === undefined) return <Loading fullHeight />;

  return (
    <Layout title="Dashboard">
      <Header title="ft_transcendence" />
      <Typography
        variant="h3"
        gutterBottom
        sx={{ margin: '50px', wordBreak: 'break-word' }}
      >
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
          <Button
            variant="contained"
            color="primary"
            sx={{
              width: '200px',
              height: '200px',
              color: 'white',
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
          </Button>
        </Link>
        <Link href="/game/home">
          <Button
            variant="contained"
            color="primary"
            sx={{
              width: '200px',
              height: '200px',
              color: 'white',
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
          </Button>
        </Link>
      </Stack>
    </Layout>
  );
};

export default Dashboard;
