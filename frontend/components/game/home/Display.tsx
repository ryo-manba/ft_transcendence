import { Grid, Paper } from '@mui/material';
import { useEffect } from 'react';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { Start } from './Start';
import { Wait } from './Wait';
import { Watch } from './Watch';
import { History } from './History';
import { Profile } from './Profile';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';

export const Display = () => {
  const { data: user } = useQueryUser();
  const { socket } = useSocketStore();
  const { playState } = usePlayStateStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);

  useEffect(() => {
    if (socket.disconnected) socket.connect();
    updatePlayState(PlayState.stateNothing);
  }, []);

  if (user === undefined) return <Loading />;

  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="stretch"
        direction="row"
        spacing={4}
        sx={{ mt: 1, height: 800 }}
      >
        <Grid item xs={5}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Profile />
          </Paper>
        </Grid>
        <Grid item xs={5}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            {playState === PlayState.stateNothing && <Start />}
            {(playState === PlayState.stateWaiting ||
              playState === PlayState.statePlaying) && <Wait />}
          </Paper>
        </Grid>
        <Grid item xs={5} sx={{ height: '50%' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <History userId={user.id} />
          </Paper>
        </Grid>
        <Grid item xs={5} sx={{ height: '50%' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Watch />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};
