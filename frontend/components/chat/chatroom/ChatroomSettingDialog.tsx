import { useState, useEffect, memo } from 'react';
import {
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
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Chatroom,
  ChatroomSettings,
  CHATROOM_SETTINGS,
  CHATROOM_TYPE,
  ChatUser,
} from 'types/chat';
import { Friend } from 'types/friend';
import { fetchJoinableFriends } from 'api/friend/fetchJoinableFriends';
import { fetchChatroomNormalUsers } from 'api/chat/fetchChatroomNormalUsers';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatroomSettingDetailDialog } from 'components/chat/chatroom/ChatroomSettingDetailDialog';
import { ChatPasswordForm } from 'components/chat/utils/ChatPasswordForm';

type Props = {
  room: Chatroom;
  open: boolean;
  onClose: () => void;
  deleteRoom: () => void;
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

export type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  checkPassword: string;
};

export const ChatroomSettingDialog = memo(function ChatroomSettingDialog({
  room,
  open,
  onClose,
  deleteRoom,
  addFriend,
  addAdmin,
  changePassword,
  banUser,
  muteUser,
}: Props) {
  const { data: user } = useQueryUser();
  const [selectedRoomSetting, setSelectedRoomSetting] =
    useState<ChatroomSettings>(CHATROOM_SETTINGS.MUTE_USER);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notAdminUsers, setNotAdminUsers] = useState<ChatUser[]>([]);
  const [notBannedUsers, setNotBannedUsers] = useState<ChatUser[]>([]);
  const [notMutedUsers, setNotMutedUsers] = useState<ChatUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  const schema = z.object({
    oldPassword: z.string().refine(
      (value: string) =>
        selectedRoomSetting !== CHATROOM_SETTINGS.CHANGE_PASSWORD ||
        value.length >= 5,
      () => ({
        message: 'Passwords must be at least 5 characters',
      }),
    ),
    newPassword: z.string().refine(
      (value: string) =>
        selectedRoomSetting !== CHATROOM_SETTINGS.CHANGE_PASSWORD ||
        value.length >= 5,
      () => ({
        message: 'Passwords must be at least 5 characters',
      }),
    ),
    checkPassword: z.string().refine(
      (value: string) =>
        selectedRoomSetting !== CHATROOM_SETTINGS.CHANGE_PASSWORD ||
        value.length >= 5,
      () => ({
        message: 'Passwords must be at least 5 characters',
      }),
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

  const fetchFriends = async (userId: number) => {
    const res = await fetchJoinableFriends({
      userId: userId,
      roomId: room.id,
    });
    setFriends(res);
  };

  const fetchCanSetAdminUsers = async () => {
    const notAdminUsers = await fetchChatroomNormalUsers({
      roomId: room.id,
    });
    setNotAdminUsers(notAdminUsers);
  };

  const fetchCanBanUsers = async () => {
    const notBannedUsers = await fetchChatroomNormalUsers({
      roomId: room.id,
    });
    setNotBannedUsers(notBannedUsers);
  };

  const fetchCanMuteUsers = async () => {
    const notMutedUsers = await fetchChatroomNormalUsers({
      roomId: room.id,
    });
    setNotMutedUsers(notMutedUsers);
  };

  // 設定項目を選択した時に対応するユーザ一覧を取得する
  useEffect(() => {
    if (user === undefined) return;
    switch (selectedRoomSetting) {
      case CHATROOM_SETTINGS.ADD_FRIEND:
        void fetchFriends(user.id);
      case CHATROOM_SETTINGS.SET_ADMIN:
        void fetchCanSetAdminUsers();
      case CHATROOM_SETTINGS.BAN_USER:
        void fetchCanBanUsers();
      case CHATROOM_SETTINGS.MUTE_USER:
        void fetchCanMuteUsers();
      default:
    }
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
    setSelectedRoomSetting(CHATROOM_SETTINGS.DELETE_ROOM);
    initDialog();
    onClose();
  };

  /// ダイアログで項目を変更したときの処理
  const handleChangeSetting = (event: SelectChangeEvent) => {
    initDialog();
    setSelectedRoomSetting(event.target.value as ChatroomSettings);
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
      case CHATROOM_SETTINGS.DELETE_ROOM:
        deleteRoom();
        break;
      case CHATROOM_SETTINGS.ADD_FRIEND:
        addFriend(Number(selectedUserId));
        break;
      case CHATROOM_SETTINGS.SET_ADMIN:
        addAdmin(Number(selectedUserId));
        break;
      case CHATROOM_SETTINGS.CHANGE_PASSWORD:
        changePassword(oldPassword, newPassword, checkPassword);
        break;
      case CHATROOM_SETTINGS.MUTE_USER:
        muteUser(Number(selectedUserId));
        break;
      case CHATROOM_SETTINGS.BAN_USER:
        banUser(Number(selectedUserId));
        break;
    }
    handleClose();
  };

  const isOwner = room.ownerId === user.id;

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Room Settings</DialogTitle>
        <DialogContent>
          <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
            <InputLabel id="room-setting-select-label">Setting</InputLabel>
            <Select
              labelId="room-setting-select-label"
              id="room-setting"
              value={selectedRoomSetting}
              label="setting"
              onChange={handleChangeSetting}
            >
              {isOwner && (
                <MenuItem value={CHATROOM_SETTINGS.DELETE_ROOM}>
                  {CHATROOM_SETTINGS.DELETE_ROOM}
                </MenuItem>
              )}
              {isOwner && (
                <MenuItem value={CHATROOM_SETTINGS.SET_ADMIN}>
                  {CHATROOM_SETTINGS.SET_ADMIN}
                </MenuItem>
              )}
              {/* パスワードで保護されたルームのみ選択可能 */}
              {isOwner && room.type === CHATROOM_TYPE.PROTECTED && (
                <MenuItem value={CHATROOM_SETTINGS.CHANGE_PASSWORD}>
                  {CHATROOM_SETTINGS.CHANGE_PASSWORD}
                </MenuItem>
              )}
              {/* 非公開のルームのみフレンド追加ボタンが選択可能 */}
              {isOwner && room.type === CHATROOM_TYPE.PRIVATE && (
                <MenuItem value={CHATROOM_SETTINGS.ADD_FRIEND}>
                  {CHATROOM_SETTINGS.ADD_FRIEND}
                </MenuItem>
              )}
              {/* 以下はAdminも設定可能な項目 */}
              <MenuItem value={CHATROOM_SETTINGS.MUTE_USER}>
                {CHATROOM_SETTINGS.MUTE_USER}
              </MenuItem>
              <MenuItem value={CHATROOM_SETTINGS.BAN_USER}>
                {CHATROOM_SETTINGS.BAN_USER}
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        {selectedRoomSetting === CHATROOM_SETTINGS.ADD_FRIEND && (
          <ChatroomSettingDetailDialog
            users={friends}
            labelTitle="Friend"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.SET_ADMIN && (
          <ChatroomSettingDetailDialog
            users={notAdminUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.CHANGE_PASSWORD && (
          <>
            <DialogContent>
              <ChatPasswordForm
                control={control}
                inputName="oldPassword"
                labelName="Old Password"
                error={errors.oldPassword}
                helperText="Must be min 5 characters"
              />
            </DialogContent>
            <DialogContent>
              <ChatPasswordForm
                control={control}
                inputName="newPassword"
                labelName="New Password"
                error={errors.newPassword}
                helperText="Must be min 5 characters"
              />
            </DialogContent>
            <DialogContent>
              <ChatPasswordForm
                control={control}
                inputName="checkPassword"
                labelName="Check Password"
                error={errors.checkPassword}
                helperText="Must be min 5 characters"
              />
            </DialogContent>
          </>
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.BAN_USER && (
          <ChatroomSettingDetailDialog
            users={notBannedUsers}
            labelTitle="User"
            selectedValue={selectedUserId}
            onChange={handleChangeUserId}
          />
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.MUTE_USER && (
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
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});
