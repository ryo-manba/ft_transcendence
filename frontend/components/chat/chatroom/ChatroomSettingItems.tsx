import { memo } from 'react';
import {
  DialogContent,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
} from '@mui/material';

import {
  ChatroomSettings,
  CHATROOM_SETTINGS,
  CHATROOM_TYPE,
  ChatroomType,
} from 'types/chat';

type Props = {
  isOwner: boolean;
  roomType: ChatroomType;
  selectedRoomSetting: ChatroomSettings;
  handleChangeSetting: (event: SelectChangeEvent) => void;
};

export const ChatroomSettingItems = memo(function ChatroomSettingItems({
  isOwner,
  roomType,
  selectedRoomSetting,
  handleChangeSetting,
}: Props) {
  return (
    <>
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
            {isOwner && roomType === CHATROOM_TYPE.PROTECTED && (
              <MenuItem value={CHATROOM_SETTINGS.CHANGE_PASSWORD}>
                {CHATROOM_SETTINGS.CHANGE_PASSWORD}
              </MenuItem>
            )}
            {/* 非公開のルームのみフレンド追加ボタンが選択可能 */}
            {isOwner && roomType === CHATROOM_TYPE.PRIVATE && (
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
    </>
  );
});
