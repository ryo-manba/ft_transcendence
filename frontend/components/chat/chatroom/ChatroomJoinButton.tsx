import { memo, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import type { Chatroom } from 'types/chat';
import { ChatroomJoinDialog } from 'components/chat/chatroom/ChatroomJoinDialog';
import { Loading } from 'components/common/Loading';
import { useQueryUser } from 'hooks/useQueryUser';
import Debug from 'debug';

type Props = {
  socket: Socket;
  addRooms: (room: Chatroom) => void;
};

export const ChatroomJoinButton = memo(function ChatroomJoinButton({
  socket,
  addRooms,
}: Props) {
  const debug = Debug('chat');
  const [open, setOpen] = useState(false);
  const [joinableRooms, setJoinableRooms] = useState<Chatroom[]>([]);
  const { data: user } = useQueryUser();

  if (user === undefined) {
    return <Loading />;
  }

  const getJoinableRooms = useCallback(() => {
    socket.emit(
      'chat:getJoinableRooms',
      { userId: user.id },
      (rooms: Chatroom[]) => {
        debug('chat:getJoinableRooms -> receive %o', rooms);
        setJoinableRooms(rooms);
      },
    );
  }, [debug, socket, user.id]);

  const handleOpen = useCallback(() => {
    // チャットルームを探すボタンを押下したら公開されているチャットルーム一覧を取得する
    getJoinableRooms();
    setOpen(true);
  }, [getJoinableRooms]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

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
      <ChatroomJoinDialog
        open={open}
        rooms={joinableRooms}
        socket={socket}
        addRooms={addRooms}
        onClose={handleClose}
      />
    </>
  );
});
