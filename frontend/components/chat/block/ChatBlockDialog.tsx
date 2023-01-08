import { memo, useState } from 'react';
import { Socket } from 'socket.io-client';
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
  Collapse,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import { ChatUser } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';

type Props = {
  socket: Socket;
  users: ChatUser[];
  open: boolean;
  onClose: () => void;
  removeFriendById: (id: number) => void;
};

export type ChatroomJoinForm = {
  password: string;
};

export const ChatBlockDialog = memo(function ChatBlockDialog({
  socket,
  users,
  open,
  onClose,
  removeFriendById,
}: Props) {
  const [selectedUser, setSelectedUser] = useState<ChatUser | undefined>(
    undefined,
  );
  const [error, setError] = useState('');

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const handleClose = () => {
    setSelectedUser(undefined);
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (selectedUser === undefined) return;

    const blockUserDto = {
      blockingUserId: selectedUser.id,
      blockedByUserId: user.id,
    };

    // ユーザーのブロック状況を反転させる
    // 通常のユーザー      -> ブロック
    // ブロック中のユーザー -> ブロック解除
    socket.emit('chat:blockUser', blockUserDto, (res: boolean) => {
      if (!res) {
        setError('Block failed.');

        return;
      }
      // ブロックしたらフレンドリストから表示を消す
      removeFriendById(selectedUser.id);
      // TODO: ブロックした側への通知をどう行うか
      handleClose();
    });
  };

  const handleClickListItem = (user: ChatUser) => {
    if (selectedUser === user) return;
    setSelectedUser(user);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>Block User</DialogTitle>
      <DialogContent sx={{ minWidth: 360, maxHeight: 360 }}>
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          {users.length === 0 ? (
            <div className="pt-4">No users are available.</div>
          ) : (
            <List sx={{ pt: 0 }}>
              {users.map((user, index) => (
                <>
                  <Box sx={{ width: '100%' }}>
                    <Collapse in={error !== ''}>
                      <ChatErrorAlert error={error} setError={setError} />
                    </Collapse>
                  </Box>
                  <ListItem
                    onClick={() => handleClickListItem(user)}
                    key={index}
                    divider
                    button
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                        {/* TODO: すでにブロックされているユーザーかどうかによってマークを変える */}
                        {/* {(isProtected(user) && <LockIcon />) || <ChatIcon />}  */}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={user.name} />
                  </ListItem>
                </>
              ))}
            </List>
          )}
          {selectedUser && (
            <p className="text-center">Selected: {selectedUser.name}</p>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedUser}
          variant="contained"
        >
          Block
        </Button>
      </DialogActions>
    </Dialog>
  );
});
