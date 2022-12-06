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
} from 'types/chat';
import { Friend } from 'types/friend';
import { fetchJoinableFriends } from 'api/friend/fetchJoinableFriends';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';

type Props = {
  room: Chatroom;
  open: boolean;
  onClose: () => void;
  deleteRoom: () => void;
  addFriend: (friendId: number) => void;
};

export const ChatroomSettingDialog = memo(function ChatroomSettingDialog({
  room,
  open,
  onClose,
  deleteRoom,
  addFriend,
}: Props) {
  const { data: user } = useQueryUser();
  const [selectedRoomSetting, setSelectedRoomSetting] =
    useState<ChatroomSettings>(CHATROOM_SETTINGS.DELETE_ROOM);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    if (user === undefined) return;
    // フレンドを追加する項目を選択時に取得する
    if (selectedRoomSetting === CHATROOM_SETTINGS.ADD_FRIEND) return;

    const fetchFriends = async () => {
      // フォローしている かつ そのチャットルームに所属していないユーザーを取得する
      const res = await fetchJoinableFriends({
        userId: user.id,
        roomId: room.id,
      });

      setFriends(res);
    };

    fetchFriends()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [selectedRoomSetting]);

  if (user === undefined) {
    return <Loading />;
  }

  const initDialog = () => {
    setSelectedRoomSetting(CHATROOM_SETTINGS.DELETE_ROOM);
    setSelectedFriendId('');
  };

  const handleClose = () => {
    initDialog();
    onClose();
  };

  /// ダイアログで項目を変更したときの処理
  const handleChangeSetting = (event: SelectChangeEvent) => {
    setSelectedRoomSetting(event.target.value as ChatroomSettings);
  };

  const handleChangeFriend = (event: SelectChangeEvent) => {
    setSelectedFriendId(event.target.value);
  };

  const handleAction = () => {
    switch (selectedRoomSetting) {
      case CHATROOM_SETTINGS.DELETE_ROOM:
        deleteRoom();
        console.log(selectedRoomSetting);
        break;
      case CHATROOM_SETTINGS.ADD_FRIEND:
        addFriend(Number(selectedFriendId));
        console.log(selectedRoomSetting);
        break;
      case CHATROOM_SETTINGS.CHANGE_PASSWORD:
        console.log(selectedRoomSetting);
        break;
      case CHATROOM_SETTINGS.SET_ADMIN:
        console.log(selectedRoomSetting);
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
              <MenuItem value={CHATROOM_SETTINGS.DELETE_ROOM}>
                {CHATROOM_SETTINGS.DELETE_ROOM}
              </MenuItem>
              <MenuItem value={CHATROOM_SETTINGS.SET_ADMIN}>
                {CHATROOM_SETTINGS.SET_ADMIN}
              </MenuItem>
              <MenuItem value={CHATROOM_SETTINGS.MUTE_USER}>
                {CHATROOM_SETTINGS.MUTE_USER}
              </MenuItem>
              <MenuItem value={CHATROOM_SETTINGS.BAN_USER}>
                {CHATROOM_SETTINGS.BAN_USER}
              </MenuItem>
              {/* 非公開のルームのみフレンドを追加ボタンが選択可能 */}
              {room.type === CHATROOM_TYPE.PRIVATE && (
                <MenuItem value={CHATROOM_SETTINGS.ADD_FRIEND}>
                  {CHATROOM_SETTINGS.ADD_FRIEND}
                </MenuItem>
              )}
              <MenuItem value={CHATROOM_SETTINGS.CHANGE_PASSWORD}>
                {CHATROOM_SETTINGS.CHANGE_PASSWORD}
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
                    value={selectedFriendId}
                    label="setting"
                    onChange={handleChangeFriend}
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
