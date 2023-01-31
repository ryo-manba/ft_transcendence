import { memo, useState, useCallback } from 'react';
import { Button } from '@mui/material';
import { Socket } from 'socket.io-client';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { Loading } from 'components/common/Loading';
import { ChatBlockDialog } from 'components/chat/block/ChatBlockDialog';
import { useQueryUser } from 'hooks/useQueryUser';

type Props = {
  socket: Socket;
  removeFriendById: (id: number) => void;
};

export const ChatBlockButton = memo(function ChatBlockButton({
  socket,
  removeFriendById,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: user } = useQueryUser();

  const handleOpen = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  if (user === undefined) {
    return <Loading />;
  }

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
        Block Setting
      </Button>
      <ChatBlockDialog
        socket={socket}
        open={dialogOpen}
        removeFriendById={removeFriendById}
        onClose={handleClose}
      />
    </>
  );
});
