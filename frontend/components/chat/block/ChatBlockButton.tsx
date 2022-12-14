import { memo, useState, useCallback } from 'react';
import { Button } from '@mui/material';
import { Socket } from 'socket.io-client';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { ChatUser } from 'types/chat';
import { Loading } from 'components/common/Loading';
import { ChatBlockDialog } from 'components/chat/block/ChatBlockDialog';
import { useQueryUser } from 'hooks/useQueryUser';
import { fetchUnblockedUsers } from 'api/chat/fetchUnblockedUsers';

type Props = {
  socket: Socket;
  removeFriendById: (id: number) => void;
};

export const ChatBlockButton = memo(function ChatBlockButton({
  socket,
  removeFriendById,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const setupUsers = async (userId: number) => {
    const chatUsers = await fetchUnblockedUsers({ userId: userId });
    const res = chatUsers.filter((chatUser) => chatUser.id !== userId);
    setUsers(res);
  };

  const handleOpen = useCallback(() => {
    // 自分以外のすべてのユーザーを取得する
    void setupUsers(user.id);
    setDialogOpen(true);
  }, [dialogOpen]);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
  }, [dialogOpen]);

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
        Block User
      </Button>
      <ChatBlockDialog
        socket={socket}
        users={users}
        open={dialogOpen}
        removeFriendById={removeFriendById}
        onClose={handleClose}
      />
    </>
  );
});
