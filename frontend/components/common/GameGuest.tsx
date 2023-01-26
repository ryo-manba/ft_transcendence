import {
  Alert,
  Button,
  ButtonGroup,
  Collapse,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
} from '@mui/material';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { Friend } from 'types/friend';
import { useRouter } from 'next/router';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { useQueryUser } from 'hooks/useQueryUser';
import { Invitation } from 'types/game';
import { CloseButton } from '@mantine/core';
import { useMutationStatus } from 'hooks/useMutationStatus';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  hosts: Friend[];
  setHosts: Dispatch<SetStateAction<Friend[]>>;
};

export const GameGuest = ({ hosts, setHosts }: Props) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(true);
  const [openDialogError, setOpenDialogError] = useState(false);
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const router = useRouter();
  const { data: user } = useQueryUser();
  const { updateStatusMutation } = useMutationStatus();

  const handleClick = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleJoinClick = useCallback(
    (friend: Friend) => {
      if (user !== undefined) {
        const match: Invitation = {
          guestId: user.id,
          hostId: friend.id,
        };
        socket.emit('acceptInvitation', match, (res: boolean) => {
          if (!res) setOpenDialogError(true);
        });
      }
    },
    [user, socket],
  );

  const handleDenyClick = useCallback(
    (friend: Friend) => {
      setHosts(hosts.filter((elem) => elem.id !== friend.id));
      if (user !== undefined) {
        const match: Invitation = {
          guestId: user.id,
          hostId: friend.id,
        };
        socket.emit('denyInvitation', match);
      }
    },
    [user, hosts, socket, setHosts],
  );

  useEffect(() => {
    if (user === undefined) return;
    const updateUserStatusPlaying = () => {
      try {
        updateStatusMutation.mutate({
          userId: user.id,
          status: 'PLAYING',
        });
      } catch (error) {
        return;
      }
    };

    socket.on('friend:select', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateSelecting);

      updateUserStatusPlaying();
      // cancel random match
      socket.emit('playCancel');
      void router.push('/game/battle');
    });
    socket.on('friend:standBy', (playerNames: [string, string]) => {
      updatePlayerNames(playerNames);
      updatePlayState(PlayState.stateStandingBy);

      updateUserStatusPlaying();
      // cancel random match
      socket.emit('playCancel');
      void router.push('/game/battle');
    });

    return () => {
      socket.off('friend:select');
      socket.off('friend:standBy');
    };
  }, [
    user,
    socket,
    router,
    updatePlayState,
    updatePlayerNames,
    updateStatusMutation,
  ]);

  return (
    <>
      <Snackbar
        open={hosts.length !== 0 && openSnackbar}
        message={`you are invited to game`}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        key={0}
        action={
          <>
            <Button onClick={handleClick}>OPEN</Button>
            <CloseButton
              onClick={() => {
                setOpenSnackbar(false);
              }}
            />
          </>
        }
      />
      <Dialog open={openDialog}>
        <DialogTitle>Friend Match</DialogTitle>
        <Collapse in={openDialogError}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setOpenDialogError(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            You already started to play/prepare game
          </Alert>
        </Collapse>
        <List>
          {hosts.map((host, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={host.name}
                sx={{
                  width: '100px',
                  overflow: 'hidden',
                  mr: '5px',
                }}
              />
              <ButtonGroup>
                <Button onClick={() => handleJoinClick(host)}>JOIN</Button>
                <Button onClick={() => handleDenyClick(host)} color="error">
                  DENY
                </Button>
              </ButtonGroup>
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
