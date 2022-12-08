import { useState } from 'react';
import {
  ListItem,
  IconButton,
  ListItemText,
  Alert,
  Box,
  Collapse,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import { Socket } from 'socket.io-client';
import { Chatroom, ChatroomType, JoinChatroomInfo } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDialog } from 'components/chat/chatroom/ChatroomSettingDialog';

type Props = {
  room: Chatroom;
  socket: Socket;
  setCurrentRoomId: (id: number) => void;
};

export const ChatroomListItem = ({ room, socket, setCurrentRoomId }: Props) => {
  const [open, setOpen] = useState(false);
  const { data: user } = useQueryUser();

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

  const handleClose = () => {
    setOpen(false);
  };

  const [warning, setWarning] = useState(false);
  const deleteRoom = () => {
    // 削除できるのはチャットルームオーナーだけ
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

  // friendをチャットルームに追加する
  const addFriend = (friendId: number) => {
    const joinRoomInfo: JoinChatroomInfo = {
      userId: friendId,
      roomId: room.id,
      type: room.type as ChatroomType,
    };

    // TODO:フレンドを入室させたあとのgatewayからのレスポンス対応は今後行う
    socket.emit('chat:joinRoom', joinRoomInfo);
  };

  const addAdmin = (userId: number) => {
    // Adminを設定できるのはチャットルームオーナーだけ
    if (user.id !== room.ownerId) {
      setWarning(true);
    } else {
      const setAdminInfo = {
        userId: userId,
        roomId: room.id,
      };
      socket.emit('chat:addAdmin', setAdminInfo);
    }
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
      {/* TODO: 一旦ルーム作成者のみに設定ボタンが表示されるようにしている */}
      {user.id === room.ownerId ? (
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
          <ChatroomSettingDialog
            room={room}
            open={open}
            onClose={handleClose}
            deleteRoom={deleteRoom}
            addFriend={addFriend}
            addAdmin={addAdmin}
          />
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
      ) : (
        <ListItem divider button>
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
      )}
    </>
  );
};
