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
      wrap="nowrap"
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
      {playState === PlayState.stateCanceled && (
        <Grid item sx={{ mt: 3 }}>
          <Typography align="center" gutterBottom variant="h4" component="h4">
            The game was canceled. Please retry a new game.
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
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h4"
                component="h4"
              >
                Win
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography
                align="center"
                gutterBottom
                variant="h4"
                component="h4"
              >
                Lose
              </Typography>
            </Grid>
          </Grid>
          <Grid container spacing={3} wrap="nowrap">
            <Grid item xs={6} zeroMinWidth>
              <Typography
                align="center"
                gutterBottom
                variant="h5"
                component="h5"
                noWrap
              >
                {finishedGameInfo.winnerName}
              </Typography>
            </Grid>
            <Grid item xs={6} zeroMinWidth>
              <Typography
                align="center"
                gutterBottom
                variant="h5"
                component="h5"
                noWrap
              >
                {finishedGameInfo.loserName}
              </Typography>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
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
      <Grid item>
        <Link href="/game/home">
          <Button variant="contained">Back to Home</Button>
        </Link>
      </Grid>
    </Grid>
  );
};
