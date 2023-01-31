import { Grid, Typography, Alert, AlertTitle } from '@mui/material';
import { Header } from 'components/common/Header';
import { Layout } from 'components/common/Layout';
import { Loading } from 'components/common/Loading';
import type { NextPage } from 'next';
import { History } from 'components/game/home/History';
import { useRouter } from 'next/router';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { BadgedAvatar } from 'components/common/BadgedAvatar';
import { useEffect, useState } from 'react';
import { GameRecordWithUserName } from 'types/game';
import { getRecordsById } from 'api/records/getRecordsById';
import { ClientUser } from 'types/user';
import { getUserById } from 'api/user/getUserById';
import { getUserRanking } from 'api/user/getUserRanking';
import { AvatarFontSize } from 'types/utils';

const Profile: NextPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<ClientUser | undefined>(undefined);
  const [userError, setUserError] = useState<Error | undefined>(undefined);
  const [records, setRecords] = useState<GameRecordWithUserName[] | undefined>(
    undefined,
  );
  const [recordsError, setRecordsError] = useState<Error | undefined>(
    undefined,
  );
  const [ranking, setRanking] = useState<number | undefined>(undefined);

  useEffect(() => {
    let ignore = false;

    const updateRanking = async (ignore: boolean) => {
      if (user === undefined) {
        return;
      }
      const currentRanking = await getUserRanking({ userId: user.id });
      if (!ignore) {
        setRanking(currentRanking);
      }
    };

    void updateRanking(ignore);

    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    let ignore = false;

    const updateRecordsNUser = async (ignore: boolean) => {
      if (router.isReady) {
        const userId = Number(router.query.userId);

        await getRecordsById({ userId })
          .then((res) => {
            if (!ignore) {
              setRecords(res);
            }
          })
          .catch((err) => {
            if (!ignore) {
              setRecordsError(err as Error);
            }
          });

        await getUserById({ userId })
          .then((res) => {
            if (!ignore) {
              setUser(res);
            }
          })
          .catch((err) => {
            if (!ignore) {
              setUserError(err as Error);
            }
          });
      }
    };

    void updateRecordsNUser(ignore);

    return () => {
      ignore = true;
    };
  }, [router]);

  if (userError !== undefined || recordsError !== undefined) {
    if (!router.isReady) {
      return <Loading fullHeight />;
    } else {
      return (
        <Layout title="Profile">
          <Header title="Profile" />
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {userError !== undefined && <p>User Fetching Error</p>}
            {recordsError !== undefined && <p>Game Records Fetching Error</p>}
          </Alert>
        </Layout>
      );
    }
  }

  if (records === undefined || user === undefined) {
    return <Loading fullHeight />;
  }

  const userName = user.name;
  const point = user.point;
  const avatarImageUrl = getAvatarImageUrl(user.id);
  const numOfWins =
    records !== undefined
      ? records.filter((r) => r.winnerName === user.name).length
      : 0;
  const numOfLosses =
    records !== undefined
      ? records.filter((r) => r.loserName === user.name).length
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
          <BadgedAvatar
            status={user.status}
            width={150}
            height={150}
            src={avatarImageUrl}
            displayName={user.name}
            avatarFontSize={AvatarFontSize.LARGE}
          />
        </Grid>
        <Grid item>
          <Typography
            gutterBottom
            variant="h1"
            component="div"
            align="center"
            sx={{ wordBreak: 'break-word' }}
          >
            {userName}
          </Typography>
        </Grid>
        <Grid container direction="row" justifyContent="center" spacing={5}>
          <Grid item>
            <Grid container direction="column" alignItems="center">
              <Grid item>
                <Typography gutterBottom variant="h5" component="div">
                  Rank
                </Typography>
              </Grid>
              <Grid item>
                <Typography gutterBottom variant="h4" component="div">
                  {ranking === undefined ? '-' : ranking}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
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
