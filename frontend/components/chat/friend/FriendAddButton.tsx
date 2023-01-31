import { memo, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendAddDialog } from 'components/chat/friend/FriendAddDialog';
import { Loading } from 'components/common/Loading';
import { fetchUnfollowingUsers } from 'api/friend/fetchUnfollowingUsers';
import { Friend } from 'types/friend';

type Props = {
  setFriends: Dispatch<SetStateAction<Friend[]>>;
};

export const FriendAddButton = memo(function FriendAddButton({
  setFriends,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unfollowingUsers, setUnFollowingUsers] = useState<Friend[]>([]);
  const { data: user } = useQueryUser();

  const setupUnfollowingUsers = useCallback(async () => {
    if (!user) return;

    const res = await fetchUnfollowingUsers({ userId: user.id });

    setUnFollowingUsers(res);
  }, [setUnFollowingUsers, user]);

  const handleOpen = useCallback(() => {
    // ボタンをクリックすると、まだフレンド追加していないUser情報を取得する
    void setupUnfollowingUsers();
    setDialogOpen(true);
  }, [setupUnfollowingUsers]);

  const handleClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const addFriends = (friend: Friend) => {
    setFriends((prev) => [...prev, friend]);
  };

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
        Add Friend
      </Button>
      <FriendAddDialog
        users={unfollowingUsers}
        open={dialogOpen}
        onClose={handleClose}
        addFriends={addFriends}
      />
    </>
  );
});
