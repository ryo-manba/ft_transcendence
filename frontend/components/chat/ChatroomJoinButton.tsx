import { memo, useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { CHATROOM_TYPE } from 'types/chat';
import { User, Chatroom } from '@prisma/client';
import { JoinRoomDialog } from 'components/chat/JoinRoomDialog';

type Props = {
  socket: Socket;
  user: Omit<User, 'hashedPassword'>;
};

export const ChatroomJoinButton = memo(function ChatroomJoinButton({
  user,
  socket,
}: Props) {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Chatroom[]>([]);

  // const getJoinedRooms = useCallback(() => {
  //   socket.emit('chat:getJoinedRooms', user.id);
  // }, [socket]);

  const getJoinableRooms = useCallback(() => {
    socket.emit('chat:getJoinableRooms', user.id);
  }, [socket]);

  const handleOpen = useCallback(() => {
    // チャットルームを探すボタンを押下したら探す処理を実行する
    getJoinableRooms();
    setOpen(true);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [open]);

  useEffect(() => {
    socket.on('chat:getJoinableRooms', (joinableRooms: Chatroom[]) => {
      console.log('chat:getJoinableRooms -> receive', joinableRooms);
      setRooms(joinableRooms);
    });

    return () => {
      socket.off('chat:getJoinableRooms');
    };
  }, [socket]);

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
        チャットルームを探す
      </Button>
      <JoinRoomDialog
        rooms={rooms}
        open={open}
        onClose={handleClose}
        socket={socket}
      />
    </>
  );
});
