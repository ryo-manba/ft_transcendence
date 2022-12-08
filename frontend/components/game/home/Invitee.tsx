import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Snackbar,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { Friend } from 'types/friend';
import { useRouter } from 'next/router';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { useQueryUser } from 'hooks/useQueryUser';
import { MatchPair } from 'types/game';

export const Invitee = () => {
  const [openInvitation, setOpenInvitation] = useState(false);
  const [openSelecter, setOpenSelecter] = useState(false);
  const { socket } = useSocketStore();
  const [inviters, setInviters] = useState<Friend[]>([]);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const router = useRouter();
  const { data: user } = useQueryUser();

  const handleClick = () => {
    setOpenSelecter(true);
    setOpenInvitation(false);
    if (inviters.length !== 0) setOpenInvitation(true);
  };
  const handleClose = () => {
    setOpenSelecter(false);
  };
  const handleSelectClick = useCallback(
    (friend: Friend) => {
      if (user !== undefined) {
        const match: MatchPair = {
          invitee: {
            name: user.name,
            id: user.id,
          },
          host: friend,
        };
        socket.emit('acceptInvitation', match);
      }
    },
    [user],
  );

  useEffect(() => {
    socket.on('inviteGame', (data: Friend) => {
      setInviters([...inviters.filter((elem) => elem.id !== data.id), data]);
      setOpenInvitation(true);
    });
    socket.on('cancelInvitation', (data: Friend) => {
      setInviters(inviters.filter((elem) => elem.id !== data.id));
      if (inviters.length === 0) setOpenSelecter(false);
      setOpenInvitation(false);
    });

    return () => {
      socket.off('inviteGame');
      socket.off('cancelInvitation');
    };
  });
  useEffect(() => {
    socket.on('select', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);
      void router.push('/game/battle');
    });
    socket.on('standBy', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);
      void router.push('/game/battle');
    });

    return () => {
      socket.off('select');
      socket.off('standBy');
    };
  }, [socket]);

  return (
    <>
      <Snackbar
        open={openInvitation}
        message={`you are invited to game`}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        key={0}
        action={<Button onClick={handleClick}>JOIN</Button>}
      />
      <Dialog open={openSelecter}>
        <DialogTitle>Friend Match</DialogTitle>
        <List>
          {inviters.map((inviter) => (
            <ListItem
              button
              key={inviter.id}
              onClick={() => handleSelectClick(inviter)}
            >
              <ListItemText primary={inviter.name} />
            </ListItem>
          ))}
        </List>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
