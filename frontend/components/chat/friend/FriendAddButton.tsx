import { memo, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendAddDialog } from 'components/chat/friend/FriendAddDialog';
import { Loading } from 'components/common/Loading';
import { fetchUnFollowingUsers } from 'api/friend/fetchUnFollowingUsers';
import { Friend } from 'types/friend';
import Debug from 'debug';

type Props = {
  setFriends: Dispatch<SetStateAction<Friend[]>>;
};

export const FriendAddButton = memo(function FriendAddButton({
  setFriends,
}: Props) {
  const debug = Debug('friend');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unfollowingUsers, setUnFollowingUsers] = useState<Friend[]>([]);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const reload = async () => {
    const res = await fetchUnFollowingUsers({ userId: user.id });

    setUnFollowingUsers(res);
  };

  const handleOpen = useCallback(() => {
    // ボタンをクリックすると、まだフレンド追加していないUser情報を取得する
    reload()
      .then((res) => {
        debug(res);
      })
      .catch((err) => {
        debug(err);
      });
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
        Add Friend
      </Button>
      <FriendAddDialog
        users={unfollowingUsers}
        open={dialogOpen}
        onClose={handleClose}
        setFriends={setFriends}
      />
    </>
  );
});
