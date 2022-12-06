import { useState } from 'react';
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
import { Chatroom, ChatroomSettings, CHATROOM_SETTINGS } from 'types/chat';
import { Socket } from 'socket.io-client';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';

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
  };

  const handleClose = () => {
    initDialog();
    setOpen(false);
  };

  const handleChangeSetting = (event: SelectChangeEvent) => {
    setSelectedRoomSetting(event.target.value as ChatroomSettings);
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

  const handleAction = () => {
    switch (selectedRoomSetting) {
      case CHATROOM_SETTINGS.DELETE_ROOM:
        deleteRoom();
        console.log(selectedRoomSetting);
        break;
      case CHATROOM_SETTINGS.ADD_FRIEND:
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
            <FormControl sx={{ m: 1, minWidth: 120 }}>
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
