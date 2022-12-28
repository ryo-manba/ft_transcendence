import { memo } from 'react';
import { Select, SelectChangeEvent, MenuItem } from '@mui/material';
import { ChatroomSetting, ChatroomType } from 'types/chat';

type Props = {
  isOwner: boolean;
  roomType: ChatroomType;
  selectedRoomSetting: ChatroomSetting;
  handleChangeSetting: (event: SelectChangeEvent) => void;
};

type DMSettingProps = {
  selectedRoomSetting: ChatroomSetting;
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
      <MenuItem value={ChatroomSetting.DELETE_ROOM}>
        {ChatroomSetting.DELETE_ROOM}
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
      <MenuItem value={ChatroomSetting.MUTE_USER}>
        {ChatroomSetting.MUTE_USER}
      </MenuItem>
      <MenuItem value={ChatroomSetting.BAN_USER}>
        {ChatroomSetting.BAN_USER}
      </MenuItem>
      {isOwner && (
        <MenuItem value={ChatroomSetting.DELETE_ROOM}>
          {ChatroomSetting.DELETE_ROOM}
        </MenuItem>
      )}
      {isOwner && (
        <MenuItem value={ChatroomSetting.SET_ADMIN}>
          {ChatroomSetting.SET_ADMIN}
        </MenuItem>
      )}
      {/* パスワードで保護されたルームのみ選択可能 */}
      {isOwner && roomType === ChatroomType.PROTECTED && (
        <MenuItem value={ChatroomSetting.CHANGE_PASSWORD}>
          {ChatroomSetting.CHANGE_PASSWORD}
        </MenuItem>
      )}
      {/* 非公開のルームのみフレンド追加ボタンが選択可能 */}
      {isOwner && roomType === ChatroomType.PRIVATE && (
        <MenuItem value={ChatroomSetting.ADD_FRIEND}>
          {ChatroomSetting.ADD_FRIEND}
        </MenuItem>
      )}
    </Select>
  );
});