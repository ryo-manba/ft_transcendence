import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { Chatroom } from '@prisma/client';
import { ChatroomJoinDialog } from 'components/chat/chatroom/ChatroomJoinDialog';
import { useSocketStore } from 'store/chat/ClientSocket';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';

export const ChatroomJoinButton = memo(function ChatroomJoinButton() {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState<Chatroom[]>([]);
  const { socket: socket } = useSocketStore();
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading fullHeight />;
  }

  const getJoinableRooms = useCallback(() => {
    socket.emit('chat:getJoinableRooms', user.id);
  }, [socket]);

  const handleOpen = useCallback(() => {
    // チャットルームを探すボタンを押下したら公開されているチャットルーム一覧を取得する
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
        Search Room
      </Button>
      <ChatroomJoinDialog rooms={rooms} open={open} onClose={handleClose} />
    </>
  );
});
