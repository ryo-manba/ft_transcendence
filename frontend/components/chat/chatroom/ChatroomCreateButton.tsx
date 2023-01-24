import { useState, memo, useCallback, Dispatch, SetStateAction } from 'react';
import { Socket } from 'socket.io-client';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Debug from 'debug';
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
import { CreateChatroomInfo, ChatroomType, Chatroom } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/alert/ChatErrorAlert';
import { ChatAlertCollapse } from 'components/chat/alert/ChatAlertCollapse';
import { ChatPasswordForm } from 'components/chat/utils/ChatPasswordForm';

type Props = {
  socket: Socket;
  setRooms: Dispatch<SetStateAction<Chatroom[]>>;
};

export type ChatroomForm = {
  roomName: string;
  password: string;
};

const ROOM_NAME_MIN_LEN = 1;
const ROOM_NAME_MAX_LEN = 150;
const PASSWORD_MIN_LEN = 5;
const PASSWORD_MAX_LEN = 50;

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
    roomName: z.string().refine(
      (value: string) =>
        ROOM_NAME_MIN_LEN <= value.length && value.length <= ROOM_NAME_MAX_LEN,
      () => ({
        message: `Room Name must be at least ${ROOM_NAME_MIN_LEN} and at most ${ROOM_NAME_MAX_LEN} characters`,
      }),
    ),
    password: z.string().refine(
      (value: string) =>
        roomType !== ChatroomType.PROTECTED ||
        (value.length >= PASSWORD_MIN_LEN && value.length <= PASSWORD_MAX_LEN),
      () => ({
        message: `Passwords must be at least ${PASSWORD_MIN_LEN} and at most ${PASSWORD_MAX_LEN} characters`,
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
    socket.emit(
      'chat:createAndJoinRoom',
      roomInfo,
      (res: { createdRoom: Chatroom | undefined }) => {
        debug('chat:createAndJoinRoom: createdRoom', res.createdRoom);

        if (res.createdRoom) {
          // 直接res.createdRoomをsetするとlintエラーが出る
          const room: Chatroom = res.createdRoom;
          setRooms((prev) => [...prev, room]);
        } else {
          setError('Failed to create room.');
        }
      },
    );
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
      <ChatAlertCollapse show={error !== ''}>
        <ChatErrorAlert error={error} setError={setError} />
      </ChatAlertCollapse>
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
