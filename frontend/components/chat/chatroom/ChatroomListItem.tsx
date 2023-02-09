import {
  memo,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useMemo,
} from 'react';
import { Socket } from 'socket.io-client';
import Debug from 'debug';
import {
  ListItem,
  IconButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import { ChatroomType } from '@prisma/client';
import { Chatroom, Message, JoinChatroomInfo, CurrentRoom } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDialog } from 'components/chat/chatroom/ChatroomSettingDialog';
import { ChatErrorAlert } from 'components/chat/alert/ChatErrorAlert';
import { ChatSuccessAlert } from 'components/chat/alert/ChatSuccessAlert';
import { ChatAlertCollapse } from 'components/chat/alert/ChatAlertCollapse';
import { fetchDMRecipientName } from 'api/chat/fetchDMRecipientName';

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
  const debug = useMemo(() => Debug('chat'), []);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { data: user } = useQueryUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roomName, setRoomName] = useState('');

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

    const updateRoomName = async (room: Chatroom, userId: number) => {
      if (room.type === ChatroomType.DM) {
        const nameOfDMRecipient = await fetchDMRecipientName({
          roomId: room.id,
          senderUserId: userId,
        });
        if (!ignore) {
          setRoomName(nameOfDMRecipient);
        }
      } else {
        if (!ignore) {
          setRoomName(room.name);
        }
      }
    };

    void updateRoomName(room, user.id);

    return () => {
      socket.off('chat:addAdmin');
      ignore = true;
    };
  }, [room, socket, user]);

  if (user === undefined) {
    return <Loading />;
  }

  // ルームをクリックしたときの処理
  const changeCurrentRoom = (
    roomId: number,
    roomName: string,
    roomType: ChatroomType,
  ) => {
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
          type: roomType,
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
      socket.emit('chat:deleteRoom', deleteRoomInfo, (isDeleted: boolean) => {
        if (!isDeleted) {
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

    socket.emit(
      'chat:joinRoomFromOtherUser',
      joinRoomInfo,
      (isSuccess: boolean) => {
        if (!isSuccess) {
          setError('Failed to add friend.');

          return;
        }

        setSuccess('Friend has been added successfully.');
      },
    );
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

    socket.emit('chat:addAdmin', addAdminInfo, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to add admin.');

        return;
      }
      setSuccess('Admin has been added successfully.');
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
    socket.emit(
      'chat:updatePassword',
      changePasswordInfo,
      (isSuccess: boolean) => {
        if (!isSuccess) {
          setError('Failed to change password.');

          return;
        }
        setSuccess('Password has been changed successfully.');
      },
    );
  };

  const deletePassword = (oldPassword: string) => {
    const deletePassword = {
      chatroomId: room.id,
      oldPassword: oldPassword,
    };
    socket.emit('chat:deletePassword', deletePassword, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to delete password.');

        return;
      }
      setSuccess('Password has been deleted successfully.');
    });
  };

  const addPassword = (newPassword: string) => {
    const adddPasswordInfo = {
      chatroomId: room.id,
      newPassword: newPassword,
    };
    socket.emit('chat:addPassword', adddPasswordInfo, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to add password.');

        return;
      }
      setSuccess('Password has been added successfully.');
    });
  };

  const banUser = (userId: number) => {
    const banUserInfo = {
      userId: userId,
      chatroomId: room.id,
    };
    socket.emit('chat:banUser', banUserInfo, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to ban user.');

        return;
      }
      setSuccess('User has been banned successfully.');
    });
  };

  const unbanUser = (userId: number) => {
    const unbanUserInfo = {
      chatroomId: room.id,
      userId: userId,
    };

    socket.emit('chat:unbanUser', unbanUserInfo, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to unban user.');

        return;
      }

      setSuccess('User has been unbanned successfully.');
    });
  };

  const muteUser = (userId: number) => {
    const muteUserInfo = {
      userId: userId,
      chatroomId: room.id,
    };

    socket.emit('chat:muteUser', muteUserInfo, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to mute user.');

        return;
      }

      setSuccess('User has been muted successfully.');
    });
  };

  const unmuteUser = (userId: number) => {
    const unmuteUserInfo = {
      chatroomId: room.id,
      userId: userId,
    };

    socket.emit('chat:unmuteUser', unmuteUserInfo, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to unmute user.');

        return;
      }

      setSuccess('User has been unmuted successfully.');
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

  const kickUser = (userId: number) => {
    const kickUsersInfo = {
      userId: userId,
      chatroomId: room.id,
    };

    socket.emit('chat:kickUser', kickUsersInfo, (isSuccess: boolean) => {
      if (!isSuccess) {
        setError('Failed to kick user.');
      } else {
        setSuccess('User has been kicked out from the chatroom successfully.');
      }
    });
  };

  return (
    <>
      <ChatAlertCollapse show={error !== ''}>
        <ChatErrorAlert error={`${room.name}: ${error}`} setError={setError} />
      </ChatAlertCollapse>
      <ChatAlertCollapse show={success !== ''}>
        <ChatSuccessAlert
          success={`${room.name}: ${success}`}
          setSuccess={setSuccess}
        />
      </ChatAlertCollapse>
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
          changeCurrentRoom(room.id, room.name, room.type);
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
          deletePassword={deletePassword}
          addPassword={addPassword}
          banUser={banUser}
          unbanUser={unbanUser}
          muteUser={muteUser}
          unmuteUser={unmuteUser}
          kickUser={kickUser}
        />
        <ListItemText
          primary={roomName}
          style={{
            overflow: 'hidden',
          }}
        />
      </ListItem>
    </>
  );
});
