import Link from 'next/link';
import { Button, Grid, Typography } from '@mui/material';
import { PlayState, usePlayStateStore } from 'store/game/PlayState';
import { FinishedGameInfo } from 'types/game';

type Props = {
  finishedGameInfo: FinishedGameInfo;
};

export const Result = ({ finishedGameInfo }: Props) => {
  const { playState } = usePlayStateStore();

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      direction="column"
      sx={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        width: '25%',
        height: '25%',
      }}
    >
      {playState === PlayState.stateNothing && (
        <Grid item sx={{ mt: 3 }}>
          <Typography align="center" gutterBottom variant="h4" component="h4">
            Something went wrong...
          </Typography>
        </Grid>
      )}
      {playState === PlayState.stateFinished && (
        <Grid container justifyContent="space-around">
          <Grid item>
            <Typography align="center" gutterBottom variant="h3" component="h3">
              Result
            </Typography>
          </Grid>
          <Grid container>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h4"
                component="h4"
              >
                Winner
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h4"
                component="h4"
              >
                Loser
              </Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h5"
                component="h5"
              >
                {finishedGameInfo.winnerName}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h5"
                component="h5"
              >
                {finishedGameInfo.loserName}
              </Typography>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h5"
                component="h5"
              >
                {finishedGameInfo.winnerScore}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h5"
                component="h5"
              >
                {finishedGameInfo.loserScore}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      )}
      <br />
      <Grid item>
        <Link href="/game/home">
          <Button variant="contained">Back to Home</Button>
        </Link>
      </Grid>
    </Grid>
  );
};
