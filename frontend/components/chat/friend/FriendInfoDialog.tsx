import { useState, memo, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import { Friend } from 'types/friend';
import { UserStatus } from 'types/game';

type Props = {
  friend: Friend;
  friendStatus: UserStatus;
  open: boolean;
  onClose: () => void;
  inviteGame: (friend: Friend) => void;
  watchGame: (friend: Friend) => void;
  directMessage: (friend: Friend) => void;
};

const FRIEND_ACTIONS = {
  PROFILE: 'Profile',
  INVITE_GAME: 'Invite Game',
  WATCH_GAME: 'Watch Game',
  DM: 'Direct Message',
} as const;

type FriendActions = (typeof FRIEND_ACTIONS)[keyof typeof FRIEND_ACTIONS];

export const FriendInfoDialog = memo(function FriendInfoDialog({
  friend,
  friendStatus,
  open,
  onClose,
  inviteGame,
  watchGame,
  directMessage,
}: Props) {
  const [actionType, setActionType] = useState<FriendActions>(
    FRIEND_ACTIONS.PROFILE,
  );
  const router = useRouter();

  const initDialog = useCallback(() => {
    setActionType('Profile');
  }, []);

  const handleChangeType = (event: SelectChangeEvent) => {
    setActionType(event.target.value as FriendActions);
  };

  const handleClose = () => {
    onClose();
    initDialog();
  };

  const handleSubmit = () => {
    const handleAction = async () => {
      handleClose();
      switch (actionType) {
        case 'Profile':
          if (router.isReady) {
            await router.push({
              pathname: '/profile',
              query: { userId: friend.id },
            });
          }
          break;
        case 'Invite Game':
          inviteGame(friend);
          break;
        case 'Watch Game':
          watchGame(friend);
          break;
        case 'Direct Message':
          directMessage(friend);
          break;
        default:
          break;
      }
    };

    void handleAction();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>{friend.name}</DialogTitle>
      <DialogContent sx={{ minWidth: 360, maxHeight: 360 }}>
        <FormControl sx={{ m: 2, minWidth: 240 }}>
          <InputLabel id="action-type-select-label">Action</InputLabel>
          <Select
            labelId="action-type-select-label"
            id="action-type"
            value={actionType}
            label="Action"
            onChange={handleChangeType}
          >
            <MenuItem value="Profile">Profile</MenuItem>
            {friendStatus !== UserStatus.PLAYING ? (
              <MenuItem value="Invite Game">Invite Game</MenuItem>
            ) : (
              <MenuItem value="Watch Game">Watch Game</MenuItem>
            )}
            <MenuItem value="Direct Message">Direct Message</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
});
