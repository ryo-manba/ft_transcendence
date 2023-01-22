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
import { Chatroom, Message, JoinChatroomInfo, CurrentRoom } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDialog } from 'components/chat/chatroom/ChatroomSettingDialog';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import Debug from 'debug';

type Props = {
  room: Chatroom;
  socket: Socket;
  setCurrentRoom: Dispatch<SetStateAction<CurrentRoom | undefined>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

export const ChatroomListItem = memo(function ChatroomListItem({
  room,
  socket,
  setCurrentRoom,
  setMessages,
}: Props) {
  const debug = Debug('chat');
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

    socket.on('chat:addAdmin', () => {
      setIsAdmin(true);
    });

    // adminかどうかを判定する
    socket.emit(
      'chat:isAdmin',
      { chatroomId: room.id, userId: user.id },
      (res: boolean) => {
        if (!ignore) {
          setIsAdmin(res);
        }
      },
    );

    return () => {
      socket.off('chat:addAdmin');
      ignore = true;
    };
  }, [user, socket]);

  // ルームをクリックしたときの処理
  const changeCurrentRoom = (roomId: number, roomName: string) => {
    debug('changeCurrentRoom: %d', roomId);

    const checkBanInfo = {
      userId: user.id,
      chatroomId: roomId,
    };
    // banされていないかチェックする
    socket.emit('chat:isBannedUser', checkBanInfo, (isBanned: boolean) => {
      debug('chat:isBannedUser %d', isBanned);
      if (isBanned) {
        setError('You were banned.');
        setCurrentRoom(undefined);
        setMessages([]);
      } else {
        // currentRoomの変更をトリガーにmessageが自動取得される
        const newCurrentRoom = {
          id: roomId,
          name: roomName,
        };
        debug('chat:changeCurrentRoom ', newCurrentRoom);
        setCurrentRoom(newCurrentRoom);
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

    socket.emit('chat:joinRoomFromOtherUser', joinRoomInfo, (res: boolean) => {
      if (!res) {
        setError('Failed to add friend.');
      }
    });
  };

  const addAdmin = (userId: number) => {
    // Adminを設定できるのはチャットルームオーナーだけ
    if (user.id !== room.ownerId) {
      setError('Only the owner can set admin.');

      return;
    }
    const addAdminInfo = {
      userId: userId,
      chatroomId: room.id,
    };

    socket.emit('chat:addAdmin', addAdminInfo, (res: boolean) => {
      if (!res) {
        setError('Failed to add admin.');
      }
    });
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

  const unbanUser = (userId: number) => {
    const unbanUserInfo = {
      chatroomId: room.id,
      userId: userId,
      status: ChatroomMembersStatus.NORMAL,
    };

    socket.emit('chat:unbanUser', unbanUserInfo, (res: boolean) => {
      if (res) {
        setSuccess('User has been unbanned successfully.');
      } else {
        setError('Failed to unban user.');
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

  const unmuteUser = (userId: number) => {
    const unmuteUserInfo = {
      chatroomId: room.id,
      userId: userId,
      status: ChatroomMembersStatus.NORMAL,
    };

    socket.emit('chat:unmuteUser', unmuteUserInfo, (res: boolean) => {
      if (res) {
        setSuccess('User has been unmuted successfully.');
      } else {
        setError('Failed to unmute user.');
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
        setCurrentRoom(undefined);
        // 所属しているチャットルーム一覧を取得する
        socket.emit('chat:getJoinedRooms', { userId: user.id });
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
        onClick={() => {
          changeCurrentRoom(room.id, room.name);
        }}
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
          unbanUser={unbanUser}
          muteUser={muteUser}
          unmuteUser={unmuteUser}
        />
        <ListItemText
          primary={room.name}
          style={{
            overflow: 'hidden',
          }}
        />
      </ListItem>
    </>
  );
});
