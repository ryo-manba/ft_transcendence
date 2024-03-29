import { Typography, Grid, Alert, AlertTitle } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PaidIcon from '@mui/icons-material/Paid';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import { Loading } from 'components/common/Loading';
import { useEffect, useState } from 'react';
import { GameRecordWithUserName } from 'types/game';
import { getRecordsById } from 'api/records/getRecordsById';
import { getUserRanking } from 'api/user/getUserRanking';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { BadgedAvatar } from 'components/common/BadgedAvatar';
import { AvatarFontSize } from 'types/utils';

export const Profile = () => {
  const { data: user } = useQueryUser();
  const [records, setRecords] = useState<GameRecordWithUserName[] | undefined>(
    undefined,
  );
  const [recordsError, setRecordsError] = useState<Error | undefined>(
    undefined,
  );
  const [ranking, setRanking] = useState<number | undefined>(undefined);

  useEffect(() => {
    let ignore = false;

    const updateRecords = async (ignore: boolean) => {
      if (user !== undefined) {
        await getRecordsById({ userId: user.id })
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
      }
    };

    const updateRanking = async (ignore: boolean) => {
      if (user === undefined) {
        return;
      }
      const currentRanking = await getUserRanking({ userId: user.id });
      if (!ignore) {
        setRanking(currentRanking);
      }
    };

    void updateRecords(ignore);
    void updateRanking(ignore);

    return () => {
      ignore = true;
    };
  }, [user]);

  if (recordsError !== undefined) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        <p>Game Records Fetching Error</p>
      </Alert>
    );
  }

  if (user === undefined) {
    return <Loading />;
  }

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
    <>
      <Typography variant="h2" align="center" gutterBottom>
        Profile
      </Typography>
      <Grid container spacing={2}>
        <Grid
          container
          item
          direction="column"
          xs={6}
          justifyContent="center"
          alignItems="center"
          spacing={1}
          wrap="nowrap"
        >
          <Grid item>
            <BadgedAvatar
              src={avatarImageUrl} // Avatar can show a default avatar image when the provided path is invalid
              width={90}
              height={90}
              displayName={user.name}
              avatarFontSize={AvatarFontSize.MEDIUM}
            />
          </Grid>
          <Grid item sx={{ width: '75%' }}>
            <Typography
              noWrap
              gutterBottom
              variant="h5"
              component="div"
              align="center"
            >
              {user.name}
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={6} sm container>
          <Grid item xs container direction="column" spacing={2} sx={{ p: 2 }}>
            <Grid
              container
              direction="row"
              alignItems="center"
              columnSpacing={1}
            >
              <Grid item>
                <EmojiEventsIcon />
              </Grid>
              <Grid item>
                <Typography variant="h5" gutterBottom>
                  {`Rank: ${ranking === undefined ? '-' : ranking}`}
                </Typography>
              </Grid>
            </Grid>
            <Grid
              container
              direction="row"
              alignItems="center"
              columnSpacing={1}
            >
              <Grid item>
                <PaidIcon />
              </Grid>
              <Grid item>
                <Typography variant="h5" gutterBottom>
                  {`Point: ${user.point}`}
                </Typography>
              </Grid>
            </Grid>
            <Grid
              container
              direction="row"
              alignItems="center"
              columnSpacing={1}
            >
              <Grid item>
                <ThumbUpOffAltIcon />
              </Grid>
              <Grid item>
                <Typography variant="h5" gutterBottom>
                  {`Win: ${numOfWins}`}
                </Typography>
              </Grid>
            </Grid>
            <Grid
              container
              direction="row"
              alignItems="center"
              columnSpacing={1}
            >
              <Grid item>
                <ThumbDownOffAltIcon />
              </Grid>
              <Grid item>
                <Typography variant="h5" gutterBottom>
                  {`Lose: ${numOfLosses}`}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
