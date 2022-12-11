import { memo, useState, Dispatch, SetStateAction } from 'react';
import {
  Avatar,
  Box,
  Button,
  Collapse,
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
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';

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

  const handleClose = () => {
    setSelectedUser(null);
    setError('');
    onClose();
  };

  const handleListItemClick = (user: Friend) => {
    // 現在選択しているユーザーの場合は何もしない
    if (selectedUser === user) return;

    setSelectedUser(user);
  };

  /**
   * onClickで直接非同期関数を呼べないのでwrapしてる
   * [参考] https://github.com/typescript-eslint/typescript-eslint/issues/4619
   */
  const handleSubmit = () => {
    const addFriend = async () => {
      if (selectedUser === null) return;

      const followProps: FollowProps = {
        followerId: user.id,
        followingId: selectedUser.id,
      };

      const res = await followUser(followProps);
      // 成功したら既存のfriendのリストを更新する
      if (res.message === 'ok') {
        setFriends((prev) => [...prev, selectedUser]);
        handleClose();
      } else {
        // 友達を追加する処理(フォロー)に失敗したらエラーメッセージをセットする
        setError(res.message);
      }
    };

    void addFriend();
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
                    <Avatar src={getAvatarImageUrl(user.id)} />
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
      <Box sx={{ width: '100%' }}>
        <Collapse in={error !== ''}>
          <ChatErrorAlert error={error} setError={setError} />
        </Collapse>
      </Box>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!selectedUser}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
});
