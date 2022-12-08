import {
  CircularProgress,
  Grid,
  Modal,
  Typography,
  Button,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import { Friend } from 'types/friend';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useRouter } from 'next/router';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { MatchPair } from 'types/game';
import { useQueryUser } from 'hooks/useQueryUser';

export const Host = () => {
  const [open, setOpen] = useState(true);
  //   const [state, setState] = useState<'waiting' | 'accepted' | 'denied'>(
  //     'waiting',
  //   );
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const router = useRouter();
  const { data: user } = useQueryUser();

  const { socket } = useSocketStore();
  const { invitedFriendState, updateInvitedFriendState } =
    useInvitedFriendStateStore();

  useEffect(() => {
    if (user !== undefined) {
      const match: MatchPair = {
        invitee: invitedFriendState.friend,
        host: {
          name: user.name,
          id: user.id,
        },
      };
      socket.emit('inviteFriend', match);
    }
  }, [user]);

  useEffect(() => {
    socket.on('select', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);
      void router.push('/game/battle');
      updateInvitedFriendState({
        friend: {} as Friend,
        invitedFriend: false,
      });
      setOpen(false);
    });
    socket.on('standBy', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);
      void router.push('/game/battle');
      updateInvitedFriendState({
        friend: {} as Friend,
        invitedFriend: false,
      });
      setOpen(false);
    });

    return () => {
      socket.off('select');
      socket.off('standBy');
    };
  }, [socket]);

  if (user === undefined) return <></>;
  const handleClose = () => {
    // [TODO] データを送るのかserver側でデータを保持しておくのか？serverのほうがよさそう。。。
    const match: MatchPair = {
      invitee: invitedFriendState.friend,
      host: {
        name: user.name,
        id: user.id,
      },
    };

    socket.emit('cancelInvitation', match);
    updateInvitedFriendState({ friend: {} as Friend, invitedFriend: false });
    setOpen(false);
  };

  return (
    <Modal open={open} aria-labelledby="modal-modal-title">
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        direction="column"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          width: '25%',
          height: '25%',
        }}
      >
        <Grid item>
          <CircularProgress />
        </Grid>
        <Grid item sx={{ mt: 1 }}>
          <Typography
            variant="h6"
            id="modal-modal-title"
            align="center"
            gutterBottom
          >
            Waiting for Opponent...
          </Typography>
        </Grid>
        <Grid item>
          <Button onClick={handleClose}>cancel</Button>
        </Grid>
      </Grid>
    </Modal>
  );
};
