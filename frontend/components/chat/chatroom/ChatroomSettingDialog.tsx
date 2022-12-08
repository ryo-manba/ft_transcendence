import { useState, useEffect, memo } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
  DialogTitle,
} from '@mui/material';
import {
  Chatroom,
  ChatroomSettings,
  CHATROOM_SETTINGS,
  CHATROOM_TYPE,
  ChatUser,
} from 'types/chat';
import { Friend } from 'types/friend';
import { fetchJoinableFriends } from 'api/friend/fetchJoinableFriends';
import { fetchNotAdminUsers } from 'api/chat/fetchNotAdminUsers';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';

type Props = {
  room: Chatroom;
  open: boolean;
  onClose: () => void;
  deleteRoom: () => void;
  addFriend: (friendId: number) => void;
  addAdmin: (userId: number) => void;
};

export const ChatroomSettingDialog = memo(function ChatroomSettingDialog({
  room,
  open,
  onClose,
  deleteRoom,
  addFriend,
  addAdmin,
}: Props) {
  const { data: user } = useQueryUser();
  const [selectedRoomSetting, setSelectedRoomSetting] =
    useState<ChatroomSettings>(CHATROOM_SETTINGS.MUTE_USER);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notAdminUsers, setNotAdminUsers] = useState<ChatUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    if (user === undefined) return;
    // フレンドを追加する項目を選択時に取得する
    if (selectedRoomSetting !== CHATROOM_SETTINGS.ADD_FRIEND) return;

    const fetchFriends = async () => {
      // フォローしている かつ そのチャットルームに所属していないユーザーを取得する
      const res = await fetchJoinableFriends({
        userId: user.id,
        roomId: room.id,
      });

      setFriends(res);
    };

    void fetchFriends();
  }, [selectedRoomSetting]);

  useEffect(() => {
    if (user === undefined) return;
    // Adminを追加する項目を選択時に取得する
    if (selectedRoomSetting !== CHATROOM_SETTINGS.SET_ADMIN) return;

    const fetchCanSetAdminUsers = async () => {
      // チャットルーム入室している かつ すでにAdminではない ユーザーを取得する
      const notAdminUsers = await fetchNotAdminUsers({
        roomId: room.id,
      });
      console.log(notAdminUsers);
      console.log(user.id);
      // オーナーを弾く
      const expectOwner = notAdminUsers.filter(
        (notAdmin) => notAdmin.id !== user.id,
      );
      console.log(expectOwner);
      setNotAdminUsers(expectOwner);
    };

    void fetchCanSetAdminUsers();
  }, [selectedRoomSetting]);

  if (user === undefined) {
    return <Loading />;
  }

  const initDialog = () => {
    setSelectedRoomSetting(CHATROOM_SETTINGS.DELETE_ROOM);
    setSelectedUserId('');
  };

  const handleClose = () => {
    initDialog();
    onClose();
  };

  /// ダイアログで項目を変更したときの処理
  const handleChangeSetting = (event: SelectChangeEvent) => {
    setSelectedRoomSetting(event.target.value as ChatroomSettings);
  };

  const handleChangeUserId = (event: SelectChangeEvent) => {
    setSelectedUserId(event.target.value);
  };

  const handleAction = () => {
    switch (selectedRoomSetting) {
      case CHATROOM_SETTINGS.DELETE_ROOM:
        deleteRoom();
        break;
      case CHATROOM_SETTINGS.ADD_FRIEND:
        addFriend(Number(selectedUserId));
        break;
      case CHATROOM_SETTINGS.CHANGE_PASSWORD:
        console.log(selectedRoomSetting);
        break;
      case CHATROOM_SETTINGS.SET_ADMIN:
        addAdmin(Number(selectedUserId));
        break;
      case CHATROOM_SETTINGS.MUTE_USER:
        console.log(selectedRoomSetting);
        break;
      case CHATROOM_SETTINGS.BAN_USER:
        console.log(selectedRoomSetting);
        break;
    }
    handleClose();
  };

  const isOwner = room.ownerId === user.id;

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Room Settings</DialogTitle>
        <DialogContent>
          <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
            <InputLabel id="room-setting-select-label">Setting</InputLabel>
            <Select
              labelId="room-setting-select-label"
              id="room-setting"
              value={selectedRoomSetting}
              label="setting"
              onChange={handleChangeSetting}
            >
              {isOwner && (
                <MenuItem value={CHATROOM_SETTINGS.DELETE_ROOM}>
                  {CHATROOM_SETTINGS.DELETE_ROOM}
                </MenuItem>
              )}
              {isOwner && (
                <MenuItem value={CHATROOM_SETTINGS.SET_ADMIN}>
                  {CHATROOM_SETTINGS.SET_ADMIN}
                </MenuItem>
              )}
              {isOwner && (
                <MenuItem value={CHATROOM_SETTINGS.CHANGE_PASSWORD}>
                  {CHATROOM_SETTINGS.CHANGE_PASSWORD}
                </MenuItem>
              )}
              {/* 非公開のルームのみフレンド追加ボタンが選択可能 */}
              {isOwner && room.type === CHATROOM_TYPE.PRIVATE && (
                <MenuItem value={CHATROOM_SETTINGS.ADD_FRIEND}>
                  {CHATROOM_SETTINGS.ADD_FRIEND}
                </MenuItem>
              )}
              {/* 以下はAdminも設定可能な項目 */}
              <MenuItem value={CHATROOM_SETTINGS.MUTE_USER}>
                {CHATROOM_SETTINGS.MUTE_USER}
              </MenuItem>
              <MenuItem value={CHATROOM_SETTINGS.BAN_USER}>
                {CHATROOM_SETTINGS.BAN_USER}
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        {selectedRoomSetting === CHATROOM_SETTINGS.ADD_FRIEND && (
          <>
            {friends.length === 0 ? (
              <div
                className="mb-4 flex justify-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
                role="alert"
              >
                <span className="font-medium">No users are available.</span>
              </div>
            ) : (
              <DialogContent>
                <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
                  <InputLabel id="room-setting-select-label">Friend</InputLabel>
                  <Select
                    labelId="room-setting-select-label"
                    id="room-setting"
                    value={selectedUserId}
                    label="setting"
                    onChange={handleChangeUserId}
                  >
                    {friends.map((friend) => (
                      <MenuItem value={String(friend.id)} key={friend.id}>
                        {friend.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
            )}
          </>
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.SET_ADMIN && (
          <>
            {notAdminUsers.length === 0 ? (
              <div
                className="mb-4 flex justify-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
                role="alert"
              >
                <span className="font-medium">No users are available.</span>
              </div>
            ) : (
              <DialogContent>
                <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
                  <InputLabel id="room-setting-select-label">User</InputLabel>
                  <Select
                    labelId="room-setting-select-label"
                    id="room-setting"
                    value={selectedUserId}
                    label="setting"
                    onChange={handleChangeUserId}
                  >
                    {notAdminUsers.map((notAdmin) => (
                      <MenuItem value={String(notAdmin.id)} key={notAdmin.id}>
                        {notAdmin.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
            )}
          </>
        )}
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAction} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
