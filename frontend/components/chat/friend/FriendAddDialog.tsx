import { memo, useState } from 'react';
import {
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
import type { Friend } from 'types/friend';
import { followUser } from 'api/friend/followUser';
import { useQueryUser } from 'hooks/useQueryUser';
import { getAvatarImageUrl } from 'api/user/getAvatarImageUrl';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/alert/ChatErrorAlert';
import { ChatAlertCollapse } from 'components/chat/alert/ChatAlertCollapse';
import { BadgedAvatar } from 'components/common/BadgedAvatar';
import { AvatarFontSize } from 'types/utils';

type Props = {
  open: boolean;
  users: Friend[];
  addFriends: (friend: Friend) => void;
  onClose: () => void;
};

type FollowProps = {
  followerId: number;
  followingId: number;
};

export const FriendAddDialog = memo(function FriendAddDialog({
  open,
  users,
  addFriends,
  onClose,
}: Props) {
  const [selectedUser, setSelectedUser] = useState<Friend | undefined>(
    undefined,
  );
  const [error, setError] = useState('');

  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <Loading />;
  }

  const handleClose = () => {
    setSelectedUser(undefined);
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
      if (!selectedUser) return;

      const followProps: FollowProps = {
        followerId: user.id,
        followingId: selectedUser.id,
      };

      const res = await followUser(followProps);
      // 成功したら既存のfriendのリストを更新する
      if (res.message === 'ok') {
        addFriends(selectedUser);
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
      <DialogContent sx={{ minWidth: 360, maxHeight: 360 }}>
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
          <List sx={{ pt: 0 }}>
            {users.length === 0 ? (
              <div className="pt-4">No users are available.</div>
            ) : (
              users.map((user) => (
                <ListItem
                  onClick={() => handleListItemClick(user)}
                  key={user.id}
                  divider
                  button
                >
                  <ListItemAvatar>
                    <BadgedAvatar
                      src={getAvatarImageUrl(user.id)}
                      displayName={user.name}
                      avatarFontSize={AvatarFontSize.SMALL}
                    />
                  </ListItemAvatar>
                  <ListItemText primary={user.name} />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </DialogContent>
      {selectedUser && (
        <p className="text-center">Selected: {selectedUser.name}</p>
      )}
      <ChatAlertCollapse show={error !== ''}>
        <ChatErrorAlert error={error} setError={setError} />
      </ChatAlertCollapse>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedUser}
          variant="contained"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
});
