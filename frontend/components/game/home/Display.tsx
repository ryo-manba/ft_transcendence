import { Grid, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { Start } from './Start';
import { Wait } from './Wait';
import { Watch } from './Watch';
import { History } from './History';
import { Profile } from './Profile';
import { useQueryUser } from 'hooks/useQueryUser';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { Host } from './Host';
import { Guest } from './Guest';
import { Loading } from 'components/common/Loading';
import { Friend } from 'types/friend';

export const Display = () => {
  const { data: user } = useQueryUser();
  const { socket } = useSocketStore();
  const { playState } = usePlayStateStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { invitedFriendState } = useInvitedFriendStateStore();
  const [hosts, setHosts] = useState<Friend[]>([]);

  useEffect(() => {
    if (socket.disconnected && user !== undefined) {
      socket.auth = { id: user.id };
      socket.connect();
    }
  }, [user]);

  useEffect(() => {
    updatePlayState(PlayState.stateNothing);
  }, []);

  useEffect(() => {
    if (user !== undefined) {
      socket.emit('subscribe', user.id, (newHosts: Friend[]) => {
        setHosts([...hosts, ...newHosts]);
      });
    }
  }, [user]);

  useEffect(() => {
    socket.on('inviteFriend', (data: Friend) => {
      setHosts([...hosts.filter((elem) => elem.id !== data.id), data]);
    });
    socket.on('cancelInvitation', (data: number) => {
      setHosts(hosts.filter((elem) => elem.id !== data));
    });

    return () => {
      socket.off('inviteFriend');
      socket.off('cancelInvitation');
    };
  });

  if (user === undefined) return <Loading />;

  return (
    <>
      {invitedFriendState.friendId !== null && <Host />}
      {hosts.length !== 0 && <Guest hosts={hosts} />}
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
