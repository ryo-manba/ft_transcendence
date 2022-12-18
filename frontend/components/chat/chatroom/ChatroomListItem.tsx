import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
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
import { Chatroom, Message, ChatroomType, JoinChatroomInfo } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDialog } from 'components/chat/chatroom/ChatroomSettingDialog';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { ChatroomMembersStatus } from '@prisma/client';

type Props = {
  room: Chatroom;
  socket: Socket;
  setCurrentRoomId: Dispatch<SetStateAction<number>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

export const ChatroomListItem = memo(function ChatroomListItem({
  room,
  socket,
  setCurrentRoomId,
  setMessages,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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

  // ルームをクリックしたときの処理
  const changeCurrentRoom = (roomId: number) => {
    console.log('changeCurrentRoom:', roomId);

    const checkBanInfo = {
      userId: user.id,
      chatroomId: roomId,
    };
    // banされていないかチェックする
    socket.emit('chat:isBannedUser', checkBanInfo, (isBanned: boolean) => {
      console.log('chat:isBannedUser', isBanned);
      if (isBanned) {
        setError('You were banned.');
        setCurrentRoomId(0);
        setMessages([]);
      } else {
        // 入室に成功したら、既存のメッセージを受け取る
        socket.emit('chat:changeCurrentRoom', roomId, (messages: Message[]) => {
          setMessages(messages);
        });
        setCurrentRoomId(roomId);
      }
    });
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const deleteRoom = () => {
    // 削除できるのはチャットルームオーナーだけ
    if (user.id !== room.ownerId) {
      setError('Only the owner can delete chat rooms.');
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
      setError('Only the owner can set admin.');
    } else {
      const setAdminInfo = {
        userId: userId,
        chatroomId: room.id,
      };

      // callbackを受け取ることで判断する
      socket.emit('chat:addAdmin', setAdminInfo, (res: boolean) => {
        if (!res) {
          setError('Failed to add admin.');
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
      setError('Check passwords did not match.');

      return;
    }
    const changePasswordInfo = {
      chatroomId: room.id,
      oldPassword: oldPassword,
      newPassword: newPassword,
    };
    socket.emit('chat:updatePassword', changePasswordInfo, (res: boolean) => {
      if (res) {
        setSuccess('Password has been changed successfully.');
      } else {
        setError('Failed to change password.');
      }
    });
  };

  const banUser = (userId: number) => {
    console.log('ban:', ChatroomMembersStatus.BAN);
    const banUserInfo = {
      chatroomId: room.id,
      userId: userId,
      status: ChatroomMembersStatus.BAN,
    };

    socket.emit('chat:banUser', banUserInfo, (res: boolean) => {
      if (res) {
        setSuccess('User has been banned successfully.');
      } else {
        setError('Failed to ban user.');
      }
    });
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Collapse in={error !== ''}>
          <ChatErrorAlert
            error={`${room.name}: ${error}`}
            setError={setError}
          />
        </Collapse>
      </Box>
      <Box sx={{ width: '100%' }}>
        <Collapse in={success !== ''}>
          <Alert
            severity="success"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setSuccess('');
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {`${room.name}: ${success}`}
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
            banUser={banUser}
          />
          <ListItemText
            primary={room.name}
            onClick={() => {
              changeCurrentRoom(room.id);
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
              changeCurrentRoom(room.id);
            }}
            style={{
              overflow: 'hidden',
            }}
          />
        </ListItem>
      )}
    </>
  );
});
