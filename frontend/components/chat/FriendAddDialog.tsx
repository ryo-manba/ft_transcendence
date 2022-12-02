import { memo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import ChatIcon from '@mui/icons-material/Chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { Friend } from 'types/friend';

type Props = {
  open: boolean;
  users: Friend[];
  onClose: () => void;
};

export const FriendAddDialog = memo(function FriendAddDialog({
  onClose,
  users,
  open,
}: Props) {
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const handleClose = () => {
    setSelectedUser(null);
    onClose();
  };

  const handleListItemClick = (user: Friend) => {
    // 現在選択しているユーザーの場合は何もしない
    if (selectedUser === user) return;

    setSelectedUser(user);
  };

  // 入室に成功したらダイアログを閉じる
  // handleClose();

  const addFriend = () => {
    if (selectedUser === null) return;
    console.log(selectedUser);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>friends</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          <List sx={{ pt: 0 }}>
            {users.length === 0 ? (
              <div className="pt-4">No friends are available.</div>
            ) : (
              users.map((user, i) => (
                <ListItem
                  onClick={() => handleListItemClick(user)}
                  key={i}
                  divider
                  button
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                      <ChatIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={user.name} />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {/* 選択されていなかったらボタンを表示しない */}
        <Button onClick={addFriend} disabled={!selectedUser}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
});
