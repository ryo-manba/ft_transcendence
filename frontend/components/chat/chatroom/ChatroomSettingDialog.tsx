import { useState, useEffect, memo } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  InputLabel,
  IconButton,
  InputAdornment,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
  DialogTitle,
  TextField,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
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
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    if (user === undefined) return;
    if (selectedRoomSetting !== CHATROOM_SETTINGS.ADD_FRIEND) return;

    const fetchFriends = async () => {
      // フォローしている かつ そのチャットルームに所属していないユーザーを取得する
      const res = await fetchJoinableFriends({
        userId: user.id,
        roomId: room.id,
      });

      setFriends(res);
    };

    void fetchFriends();
  }, [selectedRoomSetting]);

  useEffect(() => {
    if (user === undefined) return;
    if (selectedRoomSetting !== CHATROOM_SETTINGS.SET_ADMIN) return;

    const fetchCanSetAdminUsers = async () => {
      const notAdminUsers = await fetchChatroomNormalUsers({
        roomId: room.id,
      });
      setNotAdminUsers(notAdminUsers);
    };

    void fetchCanSetAdminUsers();
  }, [selectedRoomSetting]);

  useEffect(() => {
    if (user === undefined) return;
    if (selectedRoomSetting !== CHATROOM_SETTINGS.BAN_USER) return;

    const fetchCanBanUsers = async () => {
      const notBannedUsers = await fetchChatroomNormalUsers({
        roomId: room.id,
      });
      setNotBannedUsers(notBannedUsers);
    };

    void fetchCanBanUsers();
  });

  useEffect(() => {
    if (user === undefined) return;
    if (selectedRoomSetting !== CHATROOM_SETTINGS.MUTE_USER) return;

    const fetchCanMuteUsers = async () => {
      const notMutedUsers = await fetchChatroomNormalUsers({
        roomId: room.id,
      });
      setNotMutedUsers(notMutedUsers);
    };

    void fetchCanMuteUsers();
  });

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
          <>
            {notAdminUsers.length === 0 ? (
              <div
                className="mb-4 flex justify-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
                role="alert"
              >
                <span className="font-medium">No users are available.</span>
              </div>
            ) : (
              <DialogContent>
                <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
                  <InputLabel id="room-setting-select-label">User</InputLabel>
                  <Select
                    labelId="room-setting-select-label"
                    id="room-setting"
                    value={selectedUserId}
                    label="setting"
                    onChange={handleChangeUserId}
                  >
                    {notAdminUsers.map((notAdmin) => (
                      <MenuItem value={String(notAdmin.id)} key={notAdmin.id}>
                        {notAdmin.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
            )}
          </>
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.CHANGE_PASSWORD && (
          <>
            <DialogContent>
              <Controller
                name="oldPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    margin="dense"
                    label="Old Password"
                    type={showPassword ? 'text' : 'password'}
                    error={errors.oldPassword ? true : false}
                    helperText={
                      errors.oldPassword
                        ? errors.oldPassword?.message
                        : 'Must be min 5 characters'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => {
                              setShowPassword(!showPassword);
                            }}
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                    variant="standard"
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...field}
                  />
                )}
              />
            </DialogContent>
            <DialogContent>
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    margin="dense"
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    error={errors.newPassword ? true : false}
                    helperText={
                      errors.newPassword
                        ? errors.newPassword?.message
                        : 'Must be min 5 characters'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => {
                              setShowPassword(!showPassword);
                            }}
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                    variant="standard"
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...field}
                  />
                )}
              />
            </DialogContent>
            <DialogContent>
              <Controller
                name="checkPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    margin="dense"
                    label="Check Password"
                    type={showPassword ? 'text' : 'password'}
                    error={errors.checkPassword ? true : false}
                    helperText={
                      errors.checkPassword
                        ? errors.checkPassword?.message
                        : 'Must be min 5 characters'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => {
                              setShowPassword(!showPassword);
                            }}
                            onMouseDown={(event) => {
                              event.preventDefault();
                            }}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    fullWidth
                    variant="standard"
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...field}
                  />
                )}
              />
            </DialogContent>
          </>
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.BAN_USER && (
          <>
            {notBannedUsers.length === 0 ? (
              <div
                className="mb-4 flex justify-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
                role="alert"
              >
                <span className="font-medium">No users are available.</span>
              </div>
            ) : (
              <DialogContent>
                <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
                  <InputLabel id="room-setting-select-label">User</InputLabel>
                  <Select
                    labelId="room-setting-select-label"
                    id="room-setting"
                    value={selectedUserId}
                    label="setting"
                    onChange={handleChangeUserId}
                  >
                    {notBannedUsers.map((notBanned) => (
                      <MenuItem value={String(notBanned.id)} key={notBanned.id}>
                        {notBanned.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
            )}
          </>
        )}
        {selectedRoomSetting === CHATROOM_SETTINGS.MUTE_USER && (
          <>
            {notMutedUsers.length === 0 ? (
              <div
                className="mb-4 flex justify-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
                role="alert"
              >
                <span className="font-medium">No users are available.</span>
              </div>
            ) : (
              <DialogContent>
                <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
                  <InputLabel id="room-setting-select-label">User</InputLabel>
                  <Select
                    labelId="room-setting-select-label"
                    id="room-setting"
                    value={selectedUserId}
                    label="setting"
                    onChange={handleChangeUserId}
                  >
                    {notMutedUsers.map((notMutedUser) => (
                      <MenuItem
                        value={String(notMutedUser.id)}
                        key={notMutedUser.id}
                      >
                        {notMutedUser.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
            )}
          </>
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
