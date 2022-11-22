import { useState, memo, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  Button,
  TextField,
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
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { CreateChatroomInfo, ChatroomType, CHATROOM_TYPE } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';

type Props = {
  socket: Socket;
};

export const ChatroomCreateButton = memo(function ChatroomCreateButton({
  socket,
}: Props) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [roomType, setRoomType] = useState<ChatroomType>(CHATROOM_TYPE.PUBLIC);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <h1>ユーザーが存在しません</h1>;
  }

  const initDialog = useCallback(() => {
    setName('');
    setPassword('');
    setRoomType(CHATROOM_TYPE.PUBLIC);
  }, [name, password, roomType]);

  const handleChangeType = (event: SelectChangeEvent) => {
    setRoomType(event.target.value as ChatroomType);
  };

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    initDialog();
  }, [open]);

  const getRooms = useCallback(() => {
    socket.emit('chat:getRooms');
  }, [socket]);

  const createChatroom = useCallback(
    (room: CreateChatroomInfo) => {
      socket.emit('chat:create', room);
    },
    [socket],
  );

  const handleSubmit = useCallback(() => {
    if (
      name.length === 0 ||
      (roomType === CHATROOM_TYPE.PROTECTED && password.length === 0)
    ) {
      handleClose();

      return;
    }

    const room: CreateChatroomInfo = {
      name: name,
      type: roomType,
      ownerId: user.id,
    };
    if (roomType === CHATROOM_TYPE.PROTECTED) {
      room.hashedPassword = password;
    }
    createChatroom(room);
    getRooms();
    handleClose();
  }, [name, roomType, password]);

  return (
    <>
      <Button
        color="primary"
        variant="outlined"
        endIcon={
          <AddCircleOutlineRounded color="primary" sx={{ fontSize: 32 }} />
        }
        fullWidth={true}
        style={{ justifyContent: 'flex-start' }}
        onClick={handleOpen}
      >
        チャットルーム作成
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Subscribe</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Room name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            fullWidth
            variant="standard"
          />
        </DialogContent>
        {roomType === CHATROOM_TYPE.PROTECTED && (
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Password"
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              fullWidth
              variant="standard"
            />
          </DialogContent>
        )}
        <DialogContent>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="room-type-select-label">Type</InputLabel>
            <Select
              labelId="room-type-select-label"
              id="room-type"
              value={roomType}
              label="type"
              onChange={handleChangeType}
            >
              <MenuItem value={CHATROOM_TYPE.PUBLIC}>Public</MenuItem>
              <MenuItem value={CHATROOM_TYPE.PRIVATE}>Private</MenuItem>
              <MenuItem value={CHATROOM_TYPE.PROTECTED}>Protected</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
