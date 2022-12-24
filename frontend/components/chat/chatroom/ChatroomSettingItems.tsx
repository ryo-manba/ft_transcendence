import { memo } from 'react';
import { Select, SelectChangeEvent, MenuItem } from '@mui/material';
import { ChatroomSettings, CHATROOM_SETTINGS } from 'types/chat';
import { ChatroomType } from '@prisma/client';

type Props = {
  isOwner: boolean;
  roomType: ChatroomType;
  selectedRoomSetting: ChatroomSettings;
  handleChangeSetting: (event: SelectChangeEvent) => void;
};

type DMSettingProps = {
  selectedRoomSetting: ChatroomSettings;
  handleChangeSetting: (event: SelectChangeEvent) => void;
};

// DMの場合は削除のみ可能
const DMSettingItems = memo(function DMSettingItems({
  selectedRoomSetting,
  handleChangeSetting,
}: DMSettingProps) {
  return (
    <Select
      labelId="room-setting-select-label"
      id="room-setting"
      value={selectedRoomSetting}
      label="setting"
      onChange={handleChangeSetting}
    >
      <MenuItem value={CHATROOM_SETTINGS.DELETE_ROOM}>
        {CHATROOM_SETTINGS.DELETE_ROOM}
      </MenuItem>
    </Select>
  );
});

/**
 * ユーザーのタイプ：Owner, Admin, Normal
 * - チャットルームを削除する： Owner, DMの場合はAdminも可能
 * - adminを設定する：Owner
 * - friendを入室させる：PrivateかつOwnerのみ
 * - ミュートする：Owner, Admin（DMでは表示しない）
 * - BANする：Owner, Admin（DMでは表示しない）
 */
export const ChatroomSettingItems = memo(function ChatroomSettingItems({
  isOwner,
  roomType,
  selectedRoomSetting,
  handleChangeSetting,
}: Props) {
  if (roomType === ChatroomType.DM) {
    return (
      <DMSettingItems
        selectedRoomSetting={selectedRoomSetting}
        handleChangeSetting={handleChangeSetting}
      />
    );
  }

  return (
    <Select
      labelId="room-setting-select-label"
      id="room-setting"
      value={selectedRoomSetting}
      label="setting"
      onChange={handleChangeSetting}
    >
      <MenuItem value={CHATROOM_SETTINGS.MUTE_USER}>
        {CHATROOM_SETTINGS.MUTE_USER}
      </MenuItem>
      <MenuItem value={CHATROOM_SETTINGS.BAN_USER}>
        {CHATROOM_SETTINGS.BAN_USER}
      </MenuItem>
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
      {isOwner && roomType === ChatroomType.PROTECTED && (
        <MenuItem value={CHATROOM_SETTINGS.CHANGE_PASSWORD}>
          {CHATROOM_SETTINGS.CHANGE_PASSWORD}
        </MenuItem>
      )}
      {/* 非公開のルームのみフレンド追加ボタンが選択可能 */}
      {isOwner && roomType === ChatroomType.PRIVATE && (
        <MenuItem value={CHATROOM_SETTINGS.ADD_FRIEND}>
          {CHATROOM_SETTINGS.ADD_FRIEND}
        </MenuItem>
      )}
    </Select>
  );
});
