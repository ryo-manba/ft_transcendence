import { useState, memo, useCallback, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
} from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { CreateChatroomInfo, ChatroomType, Chatroom } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { ChatPasswordForm } from 'components/chat/utils/ChatPasswordForm';
import Debug from 'debug';

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
  const debug = Debug('chat');
  const [open, setOpen] = useState(false);
  const [roomType, setRoomType] = useState<ChatroomType>(ChatroomType.PUBLIC);
  const [error, setError] = useState('');

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const schema = z.object({
    roomName: z.string().min(1, { message: 'Room Name field is required' }),
    password: z.string().refine(
      (value: string) =>
        roomType !== ChatroomType.PROTECTED || value.length >= 5,
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
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setRoomType(ChatroomType.PUBLIC);
    reset();
    clearErrors();
  }, [open]);

  const createChatroom = (roomInfo: CreateChatroomInfo) => {
    socket.emit('chat:createAndJoinRoom', roomInfo, (createdRoom: Chatroom) => {
      debug('chat:createAndJoinRoom: createdRoom', createdRoom);

      if (createdRoom === undefined) {
        setError('Failed to create room.');

        return;
      }
      setRooms((prev) => [...prev, createdRoom]);
    });
  };

  const onSubmit: SubmitHandler<ChatroomForm> = (data: ChatroomForm) => {
    const room: CreateChatroomInfo = {
      name: data.roomName,
      type: roomType,
      ownerId: user.id,
      password: roomType === ChatroomType.PROTECTED ? data.password : undefined,
    };
    debug('create chatroom: %o', room);
    createChatroom(room);
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
        {roomType === ChatroomType.PROTECTED && (
          <DialogContent>
            <ChatPasswordForm
              control={control}
              inputName="password"
              labelName="Password"
              error={errors.password}
              helperText="Must be min 5 characters"
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
              <MenuItem value={ChatroomType.PUBLIC}>Public</MenuItem>
              <MenuItem value={ChatroomType.PRIVATE}>Private</MenuItem>
              <MenuItem value={ChatroomType.PROTECTED}>Protected</MenuItem>
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
            autoFocus
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
