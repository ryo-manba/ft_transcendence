import { useState, memo, useCallback, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import {
  Button,
  Box,
  Collapse,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputLabel,
  IconButton,
  InputAdornment,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import {
  CreateChatroomInfo,
  ChatroomType,
  CHATROOM_TYPE,
  Chatroom,
} from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';

type Props = {
  socket: Socket;
  setRooms: Dispatch<SetStateAction<Chatroom[]>>;
};

export type ChatroomForm = {
  roomName: string;
  password: string;
};

export const ChatroomCreateButton = memo(function ChatroomCreateButton({
  socket,
  setRooms,
}: Props) {
  const [open, setOpen] = useState(false);
  const [roomType, setRoomType] = useState<ChatroomType>(CHATROOM_TYPE.PUBLIC);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const schema = z.object({
    roomName: z.string().min(1, { message: 'Room Name field is required' }),
    password: z.string().refine(
      (value: string) =>
        roomType !== CHATROOM_TYPE.PROTECTED || value.length >= 5,
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
  } = useForm<ChatroomForm>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: {
      roomName: '',
      password: '',
    },
  });

  const handleChangeType = (event: SelectChangeEvent) => {
    reset();
    setRoomType(event.target.value as ChatroomType);
  };

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setRoomType(CHATROOM_TYPE.PUBLIC);
    reset();
    clearErrors();
  }, [open]);

  const getJoinedRooms = useCallback(() => {
    socket.emit('chat:getJoinedRooms', user.id);
  }, [socket]);

  const createChatroom = useCallback(
    (room: CreateChatroomInfo) => {
      socket.emit('chat:createRoom', room, (res: Chatroom) => {
        res === undefined
          ? setError('Failed to create room.')
          : setRooms((prev) => [...prev, res]);
      });
    },
    [socket],
  );

  const onSubmit: SubmitHandler<ChatroomForm> = (data: ChatroomForm) => {
    const room: CreateChatroomInfo = {
      name: data.roomName,
      type: roomType,
      ownerId: user.id,
      password:
        roomType === CHATROOM_TYPE.PROTECTED ? data.password : undefined,
    };
    console.log('create chatroom: %o', room);
    createChatroom(room);
    getJoinedRooms();
    handleClose();
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Collapse in={error !== ''}>
          <ChatErrorAlert error={error} setError={setError} />
        </Collapse>
      </Box>
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
        Create Room
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create Room</DialogTitle>
        <DialogContent sx={{ minWidth: 360 }}>
          <Controller
            name="roomName"
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                autoFocus
                margin="dense"
                variant="standard"
                size="small"
                label="RoomName"
                error={errors.roomName ? true : false}
                helperText={errors.roomName?.message}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...field}
              />
            )}
          />
        </DialogContent>
        {roomType === CHATROOM_TYPE.PROTECTED && (
          <DialogContent>
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
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit) as VoidFunction}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
