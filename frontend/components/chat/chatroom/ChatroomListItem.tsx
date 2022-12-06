import { useState, useEffect } from 'react';
import {
  ListItem,
  IconButton,
  ListItemText,
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
  Alert,
  Box,
  Collapse,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import {
  Chatroom,
  ChatroomSettings,
  CHATROOM_SETTINGS,
  CHATROOM_TYPE,
  ChatroomType,
  JoinChatroomInfo,
} from 'types/chat';
import { Socket } from 'socket.io-client';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { Friend } from 'types/friend';
import { fetchJoinableFriends } from 'api/friend/fetchJoinableFriends';

type Props = {
  room: Chatroom;
  socket: Socket;
  setCurrentRoomId: (id: number) => void;
};

export const ChatroomListItem = ({ room, socket, setCurrentRoomId }: Props) => {
  const [open, setOpen] = useState(false);
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
      //      const res = await fetchFollowingUsers({ userId: user.id });
      const res = await fetchJoinableFriends({
        userId: user.id,
        roomId: room.id,
      });
      console.log('joinable:', res);

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

  const getMessage = (id: number) => {
    console.log('getMessage:', id);
    socket.emit('chat:getMessage', id);
    setCurrentRoomId(id);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const initDialog = () => {
    setSelectedRoomSetting(CHATROOM_SETTINGS.DELETE_ROOM);
    setSelectedFriendId('');
  };

  const handleClose = () => {
    initDialog();
    setOpen(false);
  };

  /// ダイアログで項目を変更したときの処理
  const handleChangeSetting = (event: SelectChangeEvent) => {
    setSelectedRoomSetting(event.target.value as ChatroomSettings);
  };

  const handleChangeFriend = (event: SelectChangeEvent) => {
    setSelectedFriendId(event.target.value);
  };

  const [warning, setWarning] = useState(false);
  const deleteRoom = () => {
    console.log('deleteRoom:', room.id);

    // TODO: adminのハンドリングもチェックする
    // TODO: そもそも削除ボタンを表示しない
    if (user.id !== room.ownerId) {
      setWarning(true);
    } else {
      const deleteRoomInfo = {
        id: room.id,
        userId: user.id,
      };
      socket.emit('chat:deleteRoom', deleteRoomInfo);
    }
  };

  const addFriend = () => {
    console.log();
    // フレンドを選択する
    const joinRoomInfo: JoinChatroomInfo = {
      userId: Number(selectedFriendId),
      roomId: room.id,
      type: room.type as ChatroomType,
    };

    socket.emit('chat:joinRoom', joinRoomInfo, (response: any) => {
      console.log(response);
    });
  };

  const handleAction = () => {
    switch (selectedRoomSetting) {
      case CHATROOM_SETTINGS.DELETE_ROOM:
        deleteRoom();
        console.log(selectedRoomSetting);
        break;
      case CHATROOM_SETTINGS.ADD_FRIEND:
        addFriend();
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
      <Box sx={{ width: '100%' }}>
        <Collapse in={warning}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setWarning(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {room.name} could not be deleted.
          </Alert>
        </Collapse>
      </Box>
      <ListItem
        secondaryAction={
          <IconButton
            edge="end"
            aria-label="settings"
            onClick={handleClickOpen}
          >
            <SettingsIcon />
          </IconButton>
        }
        divider
        button
      >
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
                <MenuItem value={CHATROOM_SETTINGS.ADD_FRIEND}>
                  {CHATROOM_SETTINGS.ADD_FRIEND}
                </MenuItem>
                <MenuItem value={CHATROOM_SETTINGS.CHANGE_PASSWORD}>
                  {CHATROOM_SETTINGS.CHANGE_PASSWORD}
                </MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          {selectedRoomSetting === CHATROOM_SETTINGS.ADD_FRIEND && (
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
                  {/* menuItemをmapで出力する */}
                  {friends.map((friend) => (
                    <MenuItem value={String(friend.id)} key={friend.id}>
                      {friend.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
          )}
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleAction} autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
        <ListItemText
          primary={room.name}
          onClick={() => {
            getMessage(room.id);
          }}
          style={{
            overflow: 'hidden',
          }}
        />
      </ListItem>
    </>
  );
};
