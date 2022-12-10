import { useState, memo, useCallback } from 'react';
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
import { Friend } from 'types/friend';
import { useRouter } from 'next/router';
import { useInvitedFriendStateStore } from 'store/game/InvitedFriendState';
import Link from 'next/link';

type Props = {
  friend: Friend;
  open: boolean;
  onClose: () => void;
};

/**
 * NOTE: 現状は各項目を選択できるところまで
 * TODO: 以下の処理は今後追加する
 * - 友人のProfileを表示
 * - Gameに誘う
 * - ダイレクトメッセージ
 */
export const FriendInfoDialog = memo(function FriendInfoDialog({
  friend,
  open,
  onClose,
}: Props) {
  const [actionType, setActionType] = useState('Profile');
  const updateInvitedFriendState = useInvitedFriendStateStore(
    (store) => store.updateInvitedFriendState,
  );
  const router = useRouter();

  const initDialog = useCallback(() => {
    setActionType('Profile');
  }, [actionType]);

  const handleChangeType = (event: SelectChangeEvent) => {
    setActionType(event.target.value);
  };

  const handleClose = () => {
    onClose();
    initDialog();
  };

  const handleSubmit = (friend: Friend) => {
    switch (actionType) {
      case 'Invite Game':
        updateInvitedFriendState({ friend: friend, invitedFriend: true });
        void router.push('game/home');
    }
    onClose();
    initDialog();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{friend.name}</DialogTitle>
      <DialogContent>
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="action-type-select-label">Type</InputLabel>
          <Select
            labelId="action-type-select-label"
            id="action-type"
            value={actionType}
            label="Action"
            onChange={handleChangeType}
          >
            <Link href={{ pathname: '/profile', query: { userId: friend.id } }}>
              <MenuItem value="Profile">Profile</MenuItem>
            </Link>
            <MenuItem value="Invite Game">Invite Game</MenuItem>
            <MenuItem value="Direct Message">Direct Message</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={() => {
            handleSubmit(friend);
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
});
