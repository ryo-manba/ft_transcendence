import { styled, Typography, Grid } from '@mui/material';
import { useQueryUser } from 'hooks/useQueryUser';
import PaidIcon from '@mui/icons-material/Paid';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';

const Img = styled('img')({
  margin: 'auto',
  display: 'block',
  maxWidth: '100%',
  maxHeight: '100%',
  padding: 10,
});

export const Profile = () => {
  const { data: user } = useQueryUser();
  const userName = user !== undefined ? user.name : 'No name';
  const point = user !== undefined ? user.point : 0;

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        Profile
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Img alt="complex" src="/images/ico-default-avatar.png" />
        </Grid>
        <Grid item xs={6} sm container>
          <Grid item xs container direction="column" spacing={2} sx={{ p: 2 }}>
            <Typography gutterBottom variant="h4" component="div">
              {`${userName}`}
            </Typography>
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
                  {`Point: ${point}`}
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
                  {`Wins: ${point}`}
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
                  {`Loses: ${point}`}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
