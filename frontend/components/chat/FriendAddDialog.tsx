import { memo, useState, useEffect } from 'react';
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
import { User } from '@prisma/client';
import { Socket } from 'socket.io-client';
import { useQueryUser } from 'hooks/useQueryUser';
//import { addFriend } from 'api/friend/addFriend';

type SafetyUser = Omit<User, 'hashedPassword'>;

type Props = {
  open: boolean;
  users: SafetyUser[];
  socket: Socket;
  onClose: () => void;
};

export const FriendAddDialog = memo(function FriendAddDialog({
  onClose,
  socket,
  users,
  open,
}: Props) {
  const [selectedUser, setSelectedUser] = useState<SafetyUser | null>(null);

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <h1>ユーザーが存在しません</h1>;
  }

  const handleClose = () => {
    setSelectedUser(null);
    onClose();
  };

  const handleListItemClick = (user: SafetyUser) => {
    // 現在選択しているチャットルームの場合は何もしない
    if (selectedUser === user) return;

    setSelectedUser(user);
  };

  useEffect(() => {
    socket.on('chat:addFriend', (isSuccess: boolean) => {
      // 入室に成功したらダイアログを閉じる
      if (isSuccess) {
        handleClose();
      } else {
      }
    });

    return () => {
      socket.off('chat:addFriend');
    };
  }, []);

  const addFriend = () => {
    // addFriend({ followerId: 1, followingId: 2 });
    if (selectedUser === null) return;

    // const addFriendInfo: AddFriendInfo = {
    //   userId: user.id,
    //   addFriendId: selectedUser.id,
    // };
    // socket.emit('chat:addFriend', addFriendInfo);
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
