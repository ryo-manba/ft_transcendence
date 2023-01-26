import { memo, useState, useEffect, Dispatch, SetStateAction } from 'react';
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
import { ChatroomMembersStatus, ChatroomType } from '@prisma/client';
import { Chatroom, Message, JoinChatroomInfo, CurrentRoom } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDialog } from 'components/chat/chatroom/ChatroomSettingDialog';
import { ChatErrorAlert } from 'components/chat/alert/ChatErrorAlert';
import { ChatSuccessAlert } from 'components/chat/alert/ChatSuccessAlert';
import { ChatAlertCollapse } from 'components/chat/alert/ChatAlertCollapse';

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

    // adminかどうかを判定する
    socket.emit(
      'chat:getAdminIds',
      { roomId: room.id },
      (adminIds: number[]) => {
        debug('adminIds %o', adminIds);
        if (adminIds.includes(user.id)) {
          if (!ignore) {
            setIsAdmin(true);
          }
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [user]);

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

    socket.emit('chat:unbanUser', unbanUserInfo, (res: boolean) => {
      if (!res) {
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
