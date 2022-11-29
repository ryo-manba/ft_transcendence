import { memo, useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { User } from '@prisma/client';
import { FriendAddDialog } from 'components/chat/FriendAddDialog';

type SafetyUser = Omit<User, 'hashedPassword'>;

type Props = {
  socket: Socket;
  user: SafetyUser;
};

export const FriendAddButton = memo(function FriendAddButton({
  user,
  socket,
}: Props) {
  const [open, setOpen] = useState(false);
  const [unAddedUsers, setUnAddedUsers] = useState<SafetyUser[]>([]);

  const getUnAddedUsers = useCallback(() => {
    socket.emit('chat:getUnAddedUsers', user.id);
  }, [socket]);

  const handleOpen = useCallback(() => {
    // チャットルームを探すボタンを押下したら探す処理を実行する
    getUnAddedUsers();
    setOpen(true);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [open]);

  useEffect(() => {
    socket.on('chat:getUnAddedUsers', (unAddedUsers: User[]) => {
      console.log('chat:getUnAddedUsers -> receive', unAddedUsers);
      setUnAddedUsers(unAddedUsers);
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
        フレンドを追加する
      </Button>
      <FriendAddDialog
        users={unAddedUsers}
        open={open}
        onClose={handleClose}
        socket={socket}
      />
    </>
  );
});
