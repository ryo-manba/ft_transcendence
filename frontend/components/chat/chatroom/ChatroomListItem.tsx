import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
  ListItem,
  IconButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Box,
  Collapse,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { ChatroomMembersStatus, ChatroomType } from '@prisma/client';
import { Socket } from 'socket.io-client';
import { Chatroom, Message, JoinChatroomInfo } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDialog } from 'components/chat/chatroom/ChatroomSettingDialog';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';

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
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { data: user } = useQueryUser();
  const [isAdmin, setIsAdmin] = useState(false);

  if (user === undefined) {
    return <Loading />;
  }

  useEffect(() => {
    let ignore = false;
    if (user === undefined) return;

    // adminかどうかを判定する
    socket.emit('chat:getAdminIds', room.id, (adminIds: number[]) => {
      console.log('adminIds', adminIds);
      if (adminIds.includes(user.id)) {
        if (!ignore) {
          setIsAdmin(true);
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [user]);

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
    // NOTE: 削除できるのはチャットルームオーナーだけ
    //       DMの場合は例外的にどちらのユーザーも削除できる
    if (room.type !== ChatroomType.DM && user.id !== room.ownerId) {
      setError('Only the owner can delete chat rooms.');
    } else {
      const deleteRoomInfo = {
        id: room.id,
        userId: user.id,
      };
      socket.emit('chat:deleteRoom', deleteRoomInfo, (res: boolean) => {
        if (!res) {
          setError('Failed to delete room.');
        }
      });
    }
  };

  // friendをチャットルームに追加する
  const addFriend = (friendId: number) => {
    const joinRoomInfo: JoinChatroomInfo = {
      userId: friendId,
      chatroomId: room.id,
      type: room.type,
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

  const muteUser = (userId: number) => {
    const muteUserInfo = {
      chatroomId: room.id,
      userId: userId,
      status: ChatroomMembersStatus.MUTE,
    };

    socket.emit('chat:muteUser', muteUserInfo, (res: boolean) => {
      if (res) {
        setSuccess('User has been muted successfully.');
      } else {
        setError('Failed to mute user.');
      }
    });
  };

  const leaveRoom = (nextOwnerId: number | undefined) => {
    // オーナーが退出する場合は別のユーザーを次のオーナーにする
    if (user.id === room.ownerId && nextOwnerId) {
      const changeOwnerInfo = {
        chatroomId: room.id,
        ownerId: nextOwnerId,
      };
      socket.emit('chat:changeRoomOwner', changeOwnerInfo, (res: boolean) => {
        if (!res) {
          setError('Failed to change room owner.');

          return;
        }
      });
    }

    const leaveRoomInfo = {
      chatroomId: room.id,
      userId: user.id,
    };

    socket.emit('chat:leaveRoom', leaveRoomInfo, (res: boolean) => {
      if (res) {
        setMessages([]);
        setCurrentRoomId(0);
        // 所属しているチャットルーム一覧を取得する
        socket.emit('chat:getJoinedRooms', user.id);
      } else {
        setError('Failed to leave room.');
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
        <ListItemAvatar>
          {room.type === ChatroomType.DM ? (
            <Avatar />
          ) : (
            <Avatar>
              <ChatIcon />
            </Avatar>
          )}
        </ListItemAvatar>
        <ChatroomSettingDialog
          room={room}
          open={open}
          isAdmin={isAdmin}
          onClose={handleClose}
          deleteRoom={deleteRoom}
          leaveRoom={leaveRoom}
          addFriend={addFriend}
          addAdmin={addAdmin}
          changePassword={changePassword}
          banUser={banUser}
          muteUser={muteUser}
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
    </>
  );
});
