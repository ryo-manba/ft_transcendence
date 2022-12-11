import {
  Avatar,
  Grid,
  Typography,
  Alert,
  AlertTitle,
  Badge,
} from '@mui/material';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { Loading } from 'components/common/Loading';
import type { NextPage } from 'next';
import { useQueryGameRecords } from 'hooks/useQueryGameRecords';
import { History } from 'components/game/home/History';
import { useQueryUserById } from 'hooks/useQueryUserById';
import { useRouter } from 'next/router';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';

const Profile: NextPage = () => {
  const router = useRouter();
  const userId = Number(router.query.userId);
  const { data: user, error: userQueryError } = useQueryUserById(userId);
  const { data: records, error: recordQueryError } = useQueryGameRecords(
    user?.id,
  );

  if (router.isReady && (userQueryError || recordQueryError)) {
    return (
      <Layout title="Profile">
        <Header title="Profile" />
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {userQueryError && `User fetching error: ${userQueryError.message}`}
          {recordQueryError &&
            `Game record fetching error: ${recordQueryError.message}`}
        </Alert>
      </Layout>
    );
  } else if (
    router.isReady === false ||
    user === undefined ||
    records === undefined
  ) {
    return <Loading fullHeight />;
  }

  const userName = user.name;
  const point = user.point;
  const avatarImageUrl = getAvatarImageUrl(user.id);
  const numOfWins =
    records !== undefined
      ? records.filter((r) => r.winner.name === user.name).length
      : 0;
  const numOfLosses =
    records !== undefined
      ? records.filter((r) => r.loser.name === user.name).length
      : 0;

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
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent=""
            color={
              user.status === 'ONLINE'
                ? 'success'
                : user.status === 'PLAYING'
                ? 'error'
                : 'default'
            }
          >
            <Avatar sx={{ width: 150, height: 150 }} src={avatarImageUrl} />
          </Badge>
        </Grid>
        <Grid item>
          <Typography gutterBottom variant="h1" component="div">
            {userName}
          </Typography>
        </Grid>
        <Grid container direction="row" justifyContent="center" spacing={5}>
          <Grid item>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <Typography gutterBottom variant="h5" component="div">
                  Point
                </Typography>
              </Grid>
              <Grid item>
                <Typography gutterBottom variant="h4" component="div">
                  {point}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <Typography gutterBottom variant="h5" component="div">
                  Win
                </Typography>
              </Grid>
              <Grid item>
                <Typography gutterBottom variant="h4" component="div">
                  {numOfWins}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <Typography gutterBottom variant="h5" component="div">
                  Lose
                </Typography>
              </Grid>
              <Grid item>
                <Typography gutterBottom variant="h4" component="div">
                  {numOfLosses}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid container direction="row" justifyContent="center" spacing={5}>
          <Grid item xs={8}>
            <History userId={user.id} />
          </Grid>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Profile;
