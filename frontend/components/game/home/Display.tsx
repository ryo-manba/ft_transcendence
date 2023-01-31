import { Grid, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { Start } from './Start';
import { Wait } from './Wait';
import { Watch } from './Watch';
import { History } from './History';
import { Profile } from './Profile';
import { useQueryUser } from 'hooks/useQueryUser';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { Host } from './Host';
import { Loading } from 'components/common/Loading';

export const Display = () => {
  const { data: user } = useQueryUser();
  const { playState } = usePlayStateStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { invitedFriendState } = useInvitedFriendStateStore();
  const [openMatchError, setOpenMatchError] = useState(false);

  useEffect(() => {
    updatePlayState(PlayState.stateNothing);
  }, [updatePlayState]);

  if (user === undefined) return <Loading />;

  const showHost =
    invitedFriendState.friendId !== null ||
    playState === PlayState.stateSelecting ||
    playState === PlayState.stateStandingBy;

  return (
    <>
      {showHost && <Host />}
      <Grid
        container
        justifyContent="center"
        alignItems="stretch"
        direction="row"
        spacing={3}
        sx={{ mt: 1, height: 800 }}
      >
        <Grid item xs={5} sx={{ minWidth: '430px' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Profile />
          </Paper>
        </Grid>
        <Grid item xs={5} sx={{ minWidth: '430px' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            {playState === PlayState.stateNothing && (
              <Start setOpenMatchError={setOpenMatchError} />
            )}
            {(playState === PlayState.stateWaiting ||
              playState === PlayState.statePlaying) && (
              <Wait openMatchError={openMatchError} />
            )}
          </Paper>
        </Grid>
        <Grid item xs={5} sx={{ height: '60%', minWidth: '430px' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <History userId={user.id} />
          </Paper>
        </Grid>
        <Grid item xs={5} sx={{ height: '60%', minWidth: '430px' }}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Watch />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};
