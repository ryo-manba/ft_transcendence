import { Typography, Grid, Avatar } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import PaidIcon from '@mui/icons-material/Paid';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import { Loading } from 'components/common/Loading';
import { useQueryGameRecords } from 'hooks/useQueryGameRecords';

export const Profile = () => {
  const { data: user } = useQueryUser();
  if (user === undefined) return <Loading />;
  const avatarImageUrl =
    user.avatarPath !== null
      ? `${process.env.NEXT_PUBLIC_API_URL as string}/user/${user.avatarPath}`
      : '';
  const { data: records } = useQueryGameRecords(user.id);
  const numOfWins =
    records !== undefined
      ? records.filter((r) => r.winner.name === user.name).length
      : 0;
  const numOfLosses =
    records !== undefined
      ? records.filter((r) => r.loser.name === user.name).length
      : 0;

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        Profile
      </Typography>
      <Grid container spacing={2}>
        <Grid
          container
          direction="column"
          xs={6}
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          <Grid item>
            <Avatar
              src={avatarImageUrl} // Avatar can show a default avatar image when the provided path is invalid
              sx={{ width: 100, height: 100 }}
            />
          </Grid>
          <Grid item>
            <Typography gutterBottom variant="h5" component="div">
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
