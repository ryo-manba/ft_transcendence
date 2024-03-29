import { useState, useEffect, memo, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  SelectChangeEvent,
  DialogTitle,
  InputLabel,
  FormControl,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Chatroom, ChatroomSetting, ChatUser, ChatroomType } from 'types/chat';
import { Friend } from 'types/friend';
import { useQueryUser } from 'hooks/useQueryUser';
import { fetchMutedUsers } from 'api/chat/fetchMutedUsers';
import { fetchCanMuteUsers } from 'api/chat/fetchCanMuteUsers';
import { fetchBannedUsers } from 'api/chat/fetchBannedUsers';
import { fetchJoinableFriends } from 'api/friend/fetchJoinableFriends';
import { fetchCanSetAdminUsers } from 'api/chat/fetchCanSetAdminUsers';
import { fetchCanBanUsers } from 'api/chat/fetchCanBanUsers';
import { fetchCanSetOwnerUsers } from 'api/chat/fetchCanSetOwnerUsers';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDetailDialog } from 'components/chat/chatroom/ChatroomSettingDetailDialog';
import { ChatroomSettingItems } from 'components/chat/chatroom/ChatroomSettingItems';
import { ChatPasswordForm } from 'components/chat/utils/ChatPasswordForm';
import { fetchCanKickUsers } from 'api/chat/fetchCanKickUsers';

type Props = {
  room: Chatroom;
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  deleteRoom: () => void;
  leaveRoom: (nextOwnerId: number | undefined) => void;
  addFriend: (friendId: number) => void;
  addAdmin: (userId: number) => void;
  changePassword: (
    oldPassword: string,
    newPassword: string,
    checkPassword: string,
  ) => void;
  deletePassword: (oldPassword: string) => void;
  addPassword: (newPassword: string) => void;
  banUser: (userId: number) => void;
  unbanUser: (userId: number) => void;
  muteUser: (userId: number) => void;
  unmuteUser: (userId: number) => void;
  kickUser: (userId: number) => void;
};

type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  checkPassword: string;
};

export const ChatroomSettingDialog = memo(function ChatroomSettingDialog({
  room,
  open,
  isAdmin,
  onClose,
  deleteRoom,
  leaveRoom,
  addFriend,
  addAdmin,
  changePassword,
  deletePassword,
  addPassword,
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  kickUser,
}: Props) {
  const { data: user } = useQueryUser();

  /**
   * DMの場合はDeleteのみ選択できる
   * その他にルームは共通してLeaveが選択できる
   */
  const initRoomSettingState =
    room.type === ChatroomType.DM
      ? ChatroomSetting.DELETE_ROOM
      : ChatroomSetting.LEAVE_ROOM;

  const [selectedRoomSetting, setSelectedRoomSetting] =
    useState<ChatroomSetting>(initRoomSettingState);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notAdminUsers, setNotAdminUsers] = useState<ChatUser[]>([]);
  const [notBannedUsers, setNotBannedUsers] = useState<ChatUser[]>([]);
  const [bannedUsers, setBannedUsers] = useState<ChatUser[]>([]);
  const [notMutedUsers, setNotMutedUsers] = useState<ChatUser[]>([]);
  const [mutedUsers, setMutedUsers] = useState<ChatUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeUsers, setActiveUsers] = useState<ChatUser[]>([]);
  const [canKickUsers, setCanKickUsers] = useState<ChatUser[]>([]);

  const errorInputPassword = 'Passwords must be at least 5 characters';
  const schema = z.object({
    oldPassword: z.string().refine(
      (value: string) =>
        (selectedRoomSetting !== ChatroomSetting.CHANGE_PASSWORD &&
          selectedRoomSetting !== ChatroomSetting.DELETE_PASSWORD) ||
        value.length >= 5,
      () => ({ message: errorInputPassword }),
    ),
    newPassword: z.string().refine(
      (value: string) =>
        (selectedRoomSetting !== ChatroomSetting.CHANGE_PASSWORD &&
          selectedRoomSetting !== ChatroomSetting.ADD_PASSWORD) ||
        value.length >= 5,
      () => ({ message: errorInputPassword }),
    ),
    checkPassword: z.string().refine(
      (value: string) =>
        selectedRoomSetting !== ChatroomSetting.CHANGE_PASSWORD ||
        value.length >= 5,
      () => ({ message: errorInputPassword }),
    ),
  });

  useEffect(() => {
    // ダイアログが閉じられたらその都度、初期値に戻す
    if (!open) {
      setSelectedRoomSetting(initRoomSettingState);
    }
  }, [open, initRoomSettingState]);

  const excludeYourself = useCallback(
    (ChatUsers: ChatUser[]) => {
      return ChatUsers.filter((u) => u.id !== user?.id);
    },
    [user],
  );

  const reloadFriends = useCallback(
    async (userId: number, ignore: boolean) => {
      const res = await fetchJoinableFriends({
        userId: userId,
        roomId: room.id,
      });
      if (!ignore) {
        setFriends(res);
      }
    },
    [room.id],
  );

  const reloadCanSetAdminUsers = useCallback(
    async (ignore: boolean) => {
      if (!user) return;

      const canSetAdminUsers = await fetchCanSetAdminUsers({
        roomId: room.id,
      });

      if (!ignore) {
        setNotAdminUsers(excludeYourself(canSetAdminUsers));
      }
    },
    [user, room.id, excludeYourself],
  );

  const reloadCanBanUsers = useCallback(
    async (ignore: boolean) => {
      if (!user) return;

      const canBanUsers = await fetchCanBanUsers({
        roomId: room.id,
      });
      if (!ignore) {
        setNotBannedUsers(excludeYourself(canBanUsers));
      }
    },
    [user, room.id, excludeYourself],
  );

  const reloadCanUnbanUsers = useCallback(
    async (ignore: boolean) => {
      const bannedUsers = await fetchBannedUsers({
        roomId: room.id,
      });
      if (!ignore) {
        setBannedUsers(excludeYourself(bannedUsers));
      }
    },
    [room.id, excludeYourself],
  );

  const reloadCanMuteUsers = useCallback(
    async (ignore: boolean) => {
      if (!user) return;

      const canMuteUsers = await fetchCanMuteUsers({
        roomId: room.id,
      });

      if (!ignore) {
        setNotMutedUsers(excludeYourself(canMuteUsers));
      }
    },
    [user, room.id, excludeYourself],
  );

  const reloadCanUnmuteUsers = useCallback(
    async (ignore: boolean) => {
      const mutedUsers = await fetchMutedUsers({
        roomId: room.id,
      });
      if (!ignore) {
        setMutedUsers(excludeYourself(mutedUsers));
      }
    },
    [room.id, excludeYourself],
  );

  const reloadCanSetOwnerUsers = useCallback(
    async (ignore: boolean) => {
      const canSetOwnerUsers = await fetchCanSetOwnerUsers({
        roomId: room.id,
      });
      if (!ignore) {
        setActiveUsers(excludeYourself(canSetOwnerUsers));
      }
    },
    [room.id, excludeYourself],
  );

  const reloadCanKickUsers = useCallback(
    async (ignore: boolean) => {
      if (!user) {
        return;
      }

      const canKickUsers = await fetchCanKickUsers({
        roomId: room.id,
        userId: user.id,
      });
      if (!ignore) {
        setCanKickUsers(canKickUsers);
      }
    },
    [user, room.id],
  );

  // 設定項目を選択した時に対応するユーザ一覧を取得する
  useEffect(() => {
    let ignore = false;
    if (user === undefined || open === false) return;
    switch (selectedRoomSetting) {
      case ChatroomSetting.ADD_FRIEND:
        void reloadFriends(user.id, ignore);
        break;
      case ChatroomSetting.SET_ADMIN:
        void reloadCanSetAdminUsers(ignore);
        break;
      case ChatroomSetting.BAN_USER:
        void reloadCanBanUsers(ignore);
        break;
      case ChatroomSetting.UNBAN_USER:
        void reloadCanUnbanUsers(ignore);
        break;
      case ChatroomSetting.MUTE_USER:
        void reloadCanMuteUsers(ignore);
        break;
      case ChatroomSetting.UNMUTE_USER:
        void reloadCanUnmuteUsers(ignore);
        break;
      case ChatroomSetting.LEAVE_ROOM:
        if (user.id === room.ownerId) {
          void reloadCanSetOwnerUsers(ignore);
        }
        break;
      case ChatroomSetting.KICK_USER:
        void reloadCanKickUsers(ignore);
        break;
      default:
    }

    return () => {
      ignore = true;
    };
  }, [
    open,
    room.ownerId,
    user,
    selectedRoomSetting,
    reloadCanBanUsers,
    reloadCanMuteUsers,
    reloadCanSetAdminUsers,
    reloadCanSetOwnerUsers,
    reloadCanUnbanUsers,
    reloadCanUnmuteUsers,
    reloadFriends,
    reloadCanKickUsers,
  ]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    clearErrors,
    reset,
  } = useForm<PasswordForm>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      checkPassword: '',
    },
  });

  if (user === undefined) {
    return <Loading />;
  }

  const initDialog = () => {
    setSelectedUserId('');
    clearErrors();
    reset();
  };

  const handleClose = () => {
    setSelectedRoomSetting(initRoomSettingState);
    initDialog();
    onClose();
  };

  /// ダイアログで項目を変更したときの処理
  const handleChangeSetting = (event: SelectChangeEvent) => {
    initDialog();
    setSelectedRoomSetting(event.target.value as ChatroomSetting);
  };

  const handleChangeUserId = (event: SelectChangeEvent) => {
    setSelectedUserId(event.target.value);
  };

  const handleAction: SubmitHandler<PasswordForm> = ({
    oldPassword,
    newPassword,
    checkPassword,
  }: PasswordForm) => {
    switch (selectedRoomSetting) {
      case ChatroomSetting.DELETE_ROOM:
        deleteRoom();
        break;
      case ChatroomSetting.LEAVE_ROOM:
        const arg =
          user.id === room.ownerId ? Number(selectedUserId) : undefined;
        leaveRoom(arg);
        break;
      case ChatroomSetting.ADD_FRIEND:
        addFriend(Number(selectedUserId));
        break;
      case ChatroomSetting.SET_ADMIN:
        addAdmin(Number(selectedUserId));
        break;
      case ChatroomSetting.CHANGE_PASSWORD:
        changePassword(oldPassword, newPassword, checkPassword);
        break;
      case ChatroomSetting.DELETE_PASSWORD:
        deletePassword(oldPassword);
        break;
      case ChatroomSetting.ADD_PASSWORD:
        addPassword(newPassword);
        break;
      case ChatroomSetting.MUTE_USER:
        muteUser(Number(selectedUserId));
        break;
      case ChatroomSetting.UNMUTE_USER:
        unmuteUser(Number(selectedUserId));
        break;
      case ChatroomSetting.BAN_USER:
        banUser(Number(selectedUserId));
        break;
      case ChatroomSetting.UNBAN_USER:
        unbanUser(Number(selectedUserId));
        break;
      case ChatroomSetting.KICK_USER:
        kickUser(Number(selectedUserId));
        break;
    }
    handleClose();
  };

  const isSelectTarget = () => {
    return selectedUserId !== '';
  };
  const isDisableButton = () => {
    switch (selectedRoomSetting) {
      case ChatroomSetting.DELETE_ROOM:
        return false;
      case ChatroomSetting.LEAVE_ROOM:
        // ownerかつ選択できる場合はユーザーを選択しないとボタンを表示しない
        if (room.ownerId !== user.id) return false;
        if (activeUsers.length === 0) return false;

        return !isSelectTarget();
      case ChatroomSetting.ADD_FRIEND:
        return !isSelectTarget();
      case ChatroomSetting.SET_ADMIN:
        return !isSelectTarget();
      case ChatroomSetting.CHANGE_PASSWORD:
        return false;
      case ChatroomSetting.MUTE_USER:
        return !isSelectTarget();
      case ChatroomSetting.UNMUTE_USER:
        return !isSelectTarget();
      case ChatroomSetting.BAN_USER:
        return !isSelectTarget();
      case ChatroomSetting.UNBAN_USER:
        return !isSelectTarget();
      case ChatroomSetting.KICK_USER:
        return !isSelectTarget();
    }
  };

  const passwordHelper = 'Must be min 5 characters';
  const isOwner = room.ownerId === user.id;

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ bgcolor: blue[100] }}>Room Settings</DialogTitle>
        <DialogContent className="mt-2">
          <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
            <InputLabel id="room-setting-select-label">Setting</InputLabel>
            <ChatroomSettingItems
              isAdmin={isAdmin}
              isOwner={isOwner}
              roomType={room.type}
              selectedRoomSetting={selectedRoomSetting}
              handleChangeSetting={handleChangeSetting}
            />
          </FormControl>
        </DialogContent>
        {selectedRoomSetting === ChatroomSetting.LEAVE_ROOM && isOwner && (
          <ChatroomSettingDetailDialog
            users={activeUsers}
            labelTitle="Next Owner"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
            message="If you leave this room, it will be deleted."
          />
        )}
        {selectedRoomSetting === ChatroomSetting.ADD_FRIEND && (
          <ChatroomSettingDetailDialog
            users={friends}
            labelTitle="Friend"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === ChatroomSetting.SET_ADMIN && (
          <ChatroomSettingDetailDialog
            users={notAdminUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === ChatroomSetting.CHANGE_PASSWORD && (
          <>
            <DialogContent>
              <ChatPasswordForm
                control={control}
                inputName="oldPassword"
                labelName="Old Password"
                error={errors.oldPassword}
                helperText={passwordHelper}
              />
            </DialogContent>
            <DialogContent>
              <ChatPasswordForm
                control={control}
                inputName="newPassword"
                labelName="New Password"
                error={errors.newPassword}
                helperText={passwordHelper}
              />
            </DialogContent>
            <DialogContent>
              <ChatPasswordForm
                control={control}
                inputName="checkPassword"
                labelName="Check Password"
                error={errors.checkPassword}
                helperText={passwordHelper}
              />
            </DialogContent>
          </>
        )}
        {selectedRoomSetting === ChatroomSetting.DELETE_PASSWORD && (
          <DialogContent>
            <ChatPasswordForm
              control={control}
              inputName="oldPassword"
              labelName="Old Password"
              error={errors.oldPassword}
              helperText={passwordHelper}
            />
          </DialogContent>
        )}
        {selectedRoomSetting === ChatroomSetting.ADD_PASSWORD && (
          <DialogContent>
            <ChatPasswordForm
              control={control}
              inputName="newPassword"
              labelName="New Password"
              error={errors.newPassword}
              helperText={passwordHelper}
            />
          </DialogContent>
        )}
        {selectedRoomSetting === ChatroomSetting.BAN_USER && (
          <ChatroomSettingDetailDialog
            users={notBannedUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === ChatroomSetting.UNBAN_USER && (
          <ChatroomSettingDetailDialog
            users={bannedUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === ChatroomSetting.MUTE_USER && (
          <ChatroomSettingDetailDialog
            users={notMutedUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === ChatroomSetting.UNMUTE_USER && (
          <ChatroomSettingDetailDialog
            users={mutedUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === ChatroomSetting.KICK_USER && (
          <ChatroomSettingDetailDialog
            users={canKickUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handleAction) as VoidFunction}
            disabled={isDisableButton()}
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
