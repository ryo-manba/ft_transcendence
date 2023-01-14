import { memo, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  InputAdornment,
  IconButton,
  Collapse,
  TextField,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import ChatIcon from '@mui/icons-material/Chat';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Socket } from 'socket.io-client';
import { Chatroom, ChatroomType, JoinChatroomInfo } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';

type Props = {
  open: boolean;
  rooms: Chatroom[];
  socket: Socket;
  onClose: () => void;
  addRooms: (room: Chatroom) => void;
};

export type ChatroomJoinForm = {
  password: string;
};

export const ChatroomJoinDialog = memo(function ChatroomJoinDialog({
  open,
  rooms,
  socket,
  onClose,
  addRooms,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Chatroom | null>(null);
  const [error, setError] = useState('');

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const schema = z.object({
    password: z.string().refine(
      (value: string) =>
        selectedRoom?.type !== ChatroomType.PROTECTED || value.length >= 5,
      () => ({
        message: 'Passwords must be at least 5 characters',
      }),
    ),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    clearErrors,
    reset,
  } = useForm<ChatroomJoinForm>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
    },
  });

  const handleClose = () => {
    setSelectedRoom(null);
    setError('');
    clearErrors();
    reset();
    onClose();
  };

  const isProtected = (room: Chatroom | null) => {
    return room?.type == ChatroomType.PROTECTED;
  };

  const handleClickListItem = (room: Chatroom) => {
    // 現在選択しているチャットルームの場合は何もしない
    if (selectedRoom === room) return;
    setSelectedRoom(room);
  };

  const joinRoom = (joinRoomInfo: JoinChatroomInfo) => {
    socket.emit('chat:joinRoom', joinRoomInfo, (joinedRoom: Chatroom) => {
      // 入室に成功したらダイアログを閉じる
      if (joinedRoom) {
        handleClose();
        // 入室済みのルーム一覧に追加する
        addRooms(joinedRoom);
      } else {
        setError('Failed to join room.');
      }
    });
  };

  const onSubmit: SubmitHandler<ChatroomJoinForm> = ({
    password,
  }: ChatroomJoinForm) => {
    if (selectedRoom === null) return;

    const joinRoomInfo: JoinChatroomInfo = {
      userId: user.id,
      chatroomId: selectedRoom.id,
      type: selectedRoom.type,
      password: isProtected(selectedRoom) ? password : undefined,
    };

    joinRoom(joinRoomInfo);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>Rooms</DialogTitle>
      <DialogContent sx={{ minWidth: 360, maxHeight: 360 }}>
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          {rooms.length === 0 ? (
            <div className="pt-4">No rooms are available.</div>
          ) : (
            <List sx={{ pt: 0 }}>
              {rooms.map((room, i) => (
                <ListItem
                  onClick={() => handleClickListItem(room)}
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
          {isProtected(selectedRoom) && (
            <>
              <Box sx={{ width: '100%' }}>
                <Collapse in={error !== ''}>
                  <ChatErrorAlert error={error} setError={setError} />
                </Collapse>
              </Box>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    error={errors.password ? true : false}
                    helperText={
                      errors.password
                        ? errors.password?.message
                        : 'Must be min 5 characters'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => {
                              setShowPassword(!showPassword);
                            }}
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                    variant="standard"
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...field}
                  />
                )}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        {/* 選択されていなかったらボタンを表示しない */}
        <Button
          onClick={handleSubmit(onSubmit) as VoidFunction}
          disabled={!selectedRoom}
          variant="contained"
        >
          Join
        </Button>
      </DialogActions>
    </Dialog>
  );
});
