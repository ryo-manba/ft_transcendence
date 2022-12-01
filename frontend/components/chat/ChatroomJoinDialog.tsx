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
  TextField,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import ChatIcon from '@mui/icons-material/Chat';
import LockIcon from '@mui/icons-material/Lock';
import { Chatroom } from '@prisma/client';
import { Socket } from 'socket.io-client';
import { CHATROOM_TYPE, ChatroomType } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';

type Props = {
  open: boolean;
  rooms: Chatroom[];
  socket: Socket;
  onClose: () => void;
};

type JoinRoomInfo = {
  userId: number;
  roomId: number;
  type: ChatroomType;
  password?: string;
};

export const ChatroomJoinDialog = memo(function ChatroomJoinDialog({
  onClose,
  socket,
  rooms,
  open,
}: Props) {
  const [isInputPassword, setIsInputPassword] = useState(false);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [password, setPassword] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Chatroom | null>(null);

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <h1>ユーザーが存在しません</h1>;
  }

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
    // 現在選択しているチャットルームの場合は何もしない
    if (selectedRoom === room) return;

    setPassword('');
    setSelectedRoom(room);

    if (isProtected(room)) {
      // Protectedの場合、パスワードを受け付ける
      setIsInputPassword(true);
    } else {
      // Publicの場合、パスワードの表示を消す
      setIsInputPassword(false);
    }
  };

  useEffect(() => {
    socket.on('chat:joinRoom', (isSuccess: boolean) => {
      // 入室に成功したらダイアログを閉じる
      if (isSuccess) {
        handleClose();
      } else {
        // パスワードが不正だった場合のエラーを想定している(今後変えるかもしれない)
        setIsValidPassword(false);
      }
    });

    return () => {
      socket.off('chat:joinRoom');
    };
  }, []);

  const joinRoom = () => {
    if (selectedRoom === null) return;

    if (isProtected(selectedRoom) && password.length === 0) {
      setIsValidPassword(false);

      return;
    }
    const joinRoomInfo: JoinRoomInfo = {
      userId: user.id,
      roomId: selectedRoom.id,
      type: selectedRoom.type,
      password: isProtected(selectedRoom) ? password : undefined,
    };

    socket.emit('chat:joinRoom', joinRoomInfo);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>Rooms</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          {rooms.length === 0 ? (
            <div className="pt-4">No rooms are available.</div>
          ) : (
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
          )}
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
