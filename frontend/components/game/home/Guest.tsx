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
import { Invitation } from 'types/game';

type Props = {
  hosts: Friend[];
};

export const Guest = ({ hosts }: Props) => {
  // const [openInvitation, setOpenInvitation] = useState(false);
  const [openSelecter, setOpenSelecter] = useState(false);
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const router = useRouter();
  const { data: user } = useQueryUser();

  const handleClick = useCallback(() => {
    setOpenSelecter(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpenSelecter(false);
  }, []);

  const handleSelectClick = useCallback(
    (friend: Friend) => {
      if (user !== undefined) {
        const match: Invitation = {
          guestId: user.id,
          hostId: friend.id,
        };
        socket.emit('acceptInvitation', match);
      }
    },
    [user],
  );

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
  });

  return (
    <>
      <Snackbar
        open={hosts.length !== 0}
        message={`you are invited to game`}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        key={0}
        action={<Button onClick={handleClick}>JOIN</Button>}
      />
      <Dialog open={openSelecter}>
        <DialogTitle>Friend Match</DialogTitle>
        <List>
          {hosts.map((host) => (
            <ListItem
              button
              key={host.id}
              onClick={() => handleSelectClick(host)}
            >
              <ListItemText primary={host.name} />
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
