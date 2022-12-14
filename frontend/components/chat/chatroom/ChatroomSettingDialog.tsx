import { useState, useEffect, memo } from 'react';
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
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Chatroom, ChatroomSetting, ChatUser, ChatroomType } from 'types/chat';
import { Friend } from 'types/friend';
import { fetchJoinableFriends } from 'api/friend/fetchJoinableFriends';
import { fetchChatroomNormalUsers } from 'api/chat/fetchChatroomNormalUsers';
import { fetchActiveUsers } from 'api/chat/fetchActiveUsers';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDetailDialog } from 'components/chat/chatroom/ChatroomSettingDetailDialog';
import { ChatroomSettingItems } from 'components/chat/chatroom/ChatroomSettingItems';
import { ChatPasswordForm } from 'components/chat/utils/ChatPasswordForm';

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
  banUser: (userId: number) => void;
  muteUser: (userId: number) => void;
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
  banUser,
  muteUser,
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
  const [notMutedUsers, setNotMutedUsers] = useState<ChatUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeUsers, setActiveUsers] = useState<ChatUser[]>([]);

  const errorInputPassword = 'Passwords must be at least 5 characters';
  const schema = z.object({
    oldPassword: z.string().refine(
      (value: string) =>
        selectedRoomSetting !== ChatroomSetting.CHANGE_PASSWORD ||
        value.length >= 5,
      () => ({ message: errorInputPassword }),
    ),
    newPassword: z.string().refine(
      (value: string) =>
        selectedRoomSetting !== ChatroomSetting.CHANGE_PASSWORD ||
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
  // TODO: 余裕あったら以下を使えるようにする
  // チェック用と新規のパスワードと同じこと
  // .superRefine(({ newPassword, checkPassword }, ctx) => {
  //   if (newPassword !== checkPassword) {
  //     ctx.addIssue({
  //       code: 'custom',
  //       message: 'The passwords did not match',
  //     });
  //   }
  // });

  const fetchFriends = async (userId: number, ignore: boolean) => {
    const res = await fetchJoinableFriends({
      userId: userId,
      roomId: room.id,
    });
    if (!ignore) {
      setFriends(res);
    }
  };

  const fetchCanSetAdminUsers = async (ignore: boolean) => {
    const notAdminUsers = await fetchChatroomNormalUsers({
      roomId: room.id,
    });
    if (!ignore) {
      setNotAdminUsers(notAdminUsers);
    }
  };

  const fetchCanBanUsers = async (ignore: boolean) => {
    const notBannedUsers = await fetchChatroomNormalUsers({
      roomId: room.id,
    });
    if (!ignore) {
      setNotBannedUsers(notBannedUsers);
    }
  };

  const fetchCanMuteUsers = async (ignore: boolean) => {
    const notMutedUsers = await fetchChatroomNormalUsers({
      roomId: room.id,
    });
    if (!ignore) {
      setNotMutedUsers(notMutedUsers);
    }
  };

  const fetchCanSetOwnerUsers = async (ignore: boolean) => {
    const activeUsers = await fetchActiveUsers({
      roomId: room.id,
    });
    const activeNotOwnerUsers = activeUsers.filter(
      (user) => user.id !== room.ownerId,
    );
    if (!ignore) {
      setActiveUsers(activeNotOwnerUsers);
    }
  };

  // 設定項目を選択した時に対応するユーザ一覧を取得する
  useEffect(() => {
    let ignore = false;
    if (user === undefined) return;
    switch (selectedRoomSetting) {
      case ChatroomSetting.ADD_FRIEND:
        void fetchFriends(user.id, ignore);
        break;
      case ChatroomSetting.SET_ADMIN:
        void fetchCanSetAdminUsers(ignore);
        break;
      case ChatroomSetting.BAN_USER:
        void fetchCanBanUsers(ignore);
        break;
      case ChatroomSetting.MUTE_USER:
        void fetchCanMuteUsers(ignore);
        break;
      case ChatroomSetting.LEAVE_ROOM:
        if (user.id === room.ownerId) {
          void fetchCanSetOwnerUsers(ignore);
        }
        break;
      default:
    }

    return () => {
      ignore = true;
    };
  }, [selectedRoomSetting]);

  if (user === undefined) {
    return <Loading />;
  }

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
      case ChatroomSetting.MUTE_USER:
        muteUser(Number(selectedUserId));
        break;
      case ChatroomSetting.BAN_USER:
        banUser(Number(selectedUserId));
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
      case ChatroomSetting.BAN_USER:
        return !isSelectTarget();
    }
  };

  const passwordHelper = 'Must be min 5 characters';
  const isOwner = room.ownerId === user.id;

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Room Settings</DialogTitle>
        <DialogContent>
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
        {selectedRoomSetting === ChatroomSetting.BAN_USER && (
          <ChatroomSettingDetailDialog
            users={notBannedUsers}
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
