import { memo, useState, useCallback } from 'react';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
// import { ChatUser } from 'types/chat';

export const ChatBlockButton = memo(function ChatBlockButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  // const [users, setUsers] = useState<ChatUser[]>([]);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const handleOpen = useCallback(() => {
    // 自分以外のすべてのユーザーを取得する

    setDialogOpen(true);
  }, [dialogOpen]);

  // const handleClose = useCallback(() => {
  //   setDialogOpen(false);
  // }, [dialogOpen]);

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
      {/* <ChatBlockDialog
      open={open}
      onClose={handleClose}
      /> */}
    </>
  );
});
