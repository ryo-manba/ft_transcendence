import { memo, useState, useCallback, useEffect } from 'react';
import { Button } from '@mui/material';
import AddCircleOutlineRounded from '@mui/icons-material/AddCircleOutlineRounded';
import { useQueryUser } from 'hooks/useQueryUser';
import { FriendAddDialog } from 'components/chat/FriendAddDialog';
import { Loading } from 'components/common/Loading';
import { fetchUnFollowingUsers } from 'api/friend/fetchUnFollowingUsers';
import { Friend } from 'types/friend';

export const FriendAddButton = memo(function FriendAddButton() {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchUnFollowingUsers({ userId: user.id });
      console.log('res: ', res);

      setFriends(res);
    };

    fetchData()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleOpen = useCallback(() => {
    // チャットルームを探すボタンを押下したら探す処理を実行する
    setOpen(true);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [open]);

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
      <FriendAddDialog users={friends} open={open} onClose={handleClose} />
    </>
  );
});
