import Link from 'next/link';
import { Button, Grid, Typography } from '@mui/material';
import { PlayState, usePlayStateStore } from 'store/game/PlayState';

export const Result = () => {
  const { playState } = usePlayStateStore();

  return (
    <Grid item>
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
        <Grid item sx={{ mt: 3 }}>
          <Typography align="center" gutterBottom variant="h4" component="h4">
            {playState === PlayState.stateWinner && 'You Win!'}
            {playState === PlayState.stateLoser && 'You Lose...'}
            {playState === PlayState.stateNothing && 'Something went wrong...'}
          </Typography>
        </Grid>
        <Grid item>
          <Link href="/game/home">
            <Button variant="contained">Back to Home</Button>
          </Link>
        </Grid>
      </Grid>
    </Grid>
  );
};
