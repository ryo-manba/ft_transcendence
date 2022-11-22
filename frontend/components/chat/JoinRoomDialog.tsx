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
  TextField,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import ChatIcon from '@mui/icons-material/Chat';
import LockIcon from '@mui/icons-material/Lock';
import { Chatroom } from '@prisma/client';
import { Socket } from 'socket.io-client';
import { CHATROOM_TYPE } from 'types/chat';

type Props = {
  open: boolean;
  rooms: Chatroom[];
  socket: Socket;
  onClose: () => void;
};

export const JoinRoomDialog = memo(function JoinRoomDialog({
  onClose,
  socket,
  rooms,
  open,
}: Props) {
  const [isInputPassword, setIsInputPassword] = useState(false);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [password, setPassword] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Chatroom | null>(null);

  const handleClose = () => {
    setSelectedRoom(null);
    setIsValidPassword(true);
    setIsInputPassword(false);
    setPassword('');
    onClose();
  };

  const isProtected = (room: Chatroom) => {
    return room.type == CHATROOM_TYPE.PROTECTED;
  };

  const handleListItemClick = (room: Chatroom) => {
    setSelectedRoom(room);

    if (isProtected(room)) {
      // Protectedの場合、パスワードを受け付ける
      setIsInputPassword(true);
    } else {
      // Publicの場合、パスワードの表示を消す
      setIsInputPassword(false);
      setPassword('');
    }
  };

  const joinRoom = () => {
    if (selectedRoom === null) return;

    if (isProtected(selectedRoom) && password.length === 0) {
      setIsValidPassword(false);

      return;
    }

    // 成功したらcloseする
    // socket.emit('chat:joinRoom', selectedRoom, password);
    void socket;

    console.log('password: ', password);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>Rooms</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          <nav aria-label="main mailbox folders">
            <List sx={{ pt: 0 }}>
              {rooms.map((room, i) => (
                <ListItem
                  onClick={() => handleListItemClick(room)}
                  key={i}
                  divider
                  button
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                      {(isProtected(room) && <LockIcon />) || <ChatIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={room.name} />
                </ListItem>
              ))}
            </List>
            {isInputPassword && (
              <TextField
                fullWidth
                margin="dense"
                id="password"
                label="Password"
                type="text"
                value={password}
                error={!isValidPassword}
                helperText="Enter password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            )}
          </nav>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {/* 選択されていなかったらボタンを表示しない */}
        <Button onClick={joinRoom} disabled={!selectedRoom}>
          Join
        </Button>
      </DialogActions>
    </Dialog>
  );
});
