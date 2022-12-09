import { useState, useEffect } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const { data: user } = useQueryUser();

  useEffect(() => {
    if (!user) return;

    // adminかどうかを判定する
    socket.emit('chat:getAdminIds', room.id, (adminIds: number[]) => {
      console.log('adminIds', adminIds);
      adminIds.map((id) => {
        if (id === user.id) {
          setIsAdmin(true);
        }
      });
    });
  }, [user]);

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
        chatroomId: room.id,
      };

      // callbackを受け取ることで判断する
      socket.emit('chat:addAdmin', setAdminInfo, (res: boolean) => {
        if (!res) {
          setWarning(true);
        }
      });
    }
  };

  const changePassword = (
    oldPassword: string,
    newPassword: string,
    checkPassword: string,
  ) => {
    if (newPassword !== checkPassword) {
      // 新しいパスワードとチェック用パスワードが違う
      setWarning(true);

      return;
    }
    const changePasswordInfo = {
      chatroomId: room.id,
      oldPassword: oldPassword,
      newPassword: newPassword,
    };
    socket.emit('chat:updatePassword', changePasswordInfo, (res: boolean) => {
      if (res) {
        setChangeSuccess(true);
      } else {
        setWarning(true);
      }
    });
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
            {room.name} failed to process.
          </Alert>
        </Collapse>
      </Box>
      <Box sx={{ width: '100%' }}>
        <Collapse in={changeSuccess}>
          <Alert
            severity="success"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setChangeSuccess(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {room.name} password changed.
          </Alert>
        </Collapse>
      </Box>
      {user.id === room.ownerId || isAdmin ? (
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
            changePassword={changePassword}
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
