import { Avatar, Grid, Typography } from '@mui/material';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { Loading } from 'components/common/Loading';
import { useQueryUser } from 'hooks/useQueryUser';
import type { NextPage } from 'next';

const Profile: NextPage = () => {
  const { data: user } = useQueryUser();
  if (user === undefined) return <Loading fullHeight />;
  const userName = user.name;
  const point = user.point;
  const avatarImageUrl =
    user.avatarPath !== null
      ? `${process.env.NEXT_PUBLIC_API_URL as string}/user/${user.avatarPath}`
      : '';

  return (
    <Layout title="Profile">
      <Header title="Profile" />
      <Grid
        container
        direction="column"
        alignItems="center"
        spacing={2}
        sx={{ p: 2 }}
      >
        <Grid item>
          <Avatar sx={{ width: 150, height: 150 }} src={avatarImageUrl} />
        </Grid>
        <Grid item>
          <Typography gutterBottom variant="h3" component="div">
            {userName}
          </Typography>
        </Grid>
        <Grid container direction="row" justifyContent="center" spacing={5}>
          <Grid item>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <Typography gutterBottom variant="subtitle1" component="div">
                  Point
                </Typography>
              </Grid>
              <Grid item>
                <Typography gutterBottom variant="h5" component="div">
                  {point}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <Typography gutterBottom variant="subtitle1" component="div">
                  Wins
                </Typography>
              </Grid>
              <Grid item>
                <Typography gutterBottom variant="h5" component="div">
                  {point}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <Typography gutterBottom variant="subtitle1" component="div">
                  Loses
                </Typography>
              </Grid>
              <Grid item>
                <Typography gutterBottom variant="h5" component="div">
                  {point}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Profile;