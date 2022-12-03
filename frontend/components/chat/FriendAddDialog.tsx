import { memo, useState, Dispatch, SetStateAction } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { followUser } from 'api/friend/followUser';
import type { Friend } from 'types/friend';

type Props = {
  open: boolean;
  users: Friend[];
  setFriends: Dispatch<SetStateAction<Friend[]>>;
  onClose: () => void;
};

type FollowProps = {
  followerId: number;
  followingId: number;
};

export const FriendAddDialog = memo(function FriendAddDialog({
  open,
  users,
  setFriends,
  onClose,
}: Props) {
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
  const [error, setError] = useState('');

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const addFriend = async (props: FollowProps) => {
    const res = await followUser(props);

    // 友達を追加する処理(フォロー)に失敗したらエラーメッセージをセットする
    if (res.message !== 'ok') {
      setError(res.message);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    onClose();
  };

  const handleListItemClick = (user: Friend) => {
    // 現在選択しているユーザーの場合は何もしない
    if (selectedUser === user) return;

    setSelectedUser(user);
  };

  const handleSubmit = () => {
    if (selectedUser === null) return;

    const followProps: FollowProps = {
      followerId: user.id,
      followingId: selectedUser.id,
    };

    addFriend(followProps)
      .then((res) => {
        // 成功したら既存のfriendのリストを更新する
        setFriends((prev) => [...prev, selectedUser]);
        handleClose();
        console.log('res:', res);
      })
      .catch((err) => {
        console.log('err:', err);
      });
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>Users</DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          <List sx={{ pt: 0 }}>
            {users.length === 0 ? (
              <div className="pt-4">No users are available.</div>
            ) : (
              users.map((user, i) => (
                <ListItem
                  onClick={() => handleListItemClick(user)}
                  key={i}
                  divider
                  button
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: blue[100], color: blue[600] }} />
                  </ListItemAvatar>
                  <ListItemText primary={user.name} />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </DialogContent>
      {users.length !== 0 && (
        <p className="flex justify-center">Selected: {selectedUser?.name}</p>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!selectedUser}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
});
