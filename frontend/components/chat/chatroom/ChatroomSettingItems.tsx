import { memo } from 'react';
import { Select, SelectChangeEvent, MenuItem } from '@mui/material';
import { ChatroomSetting, ChatroomType } from 'types/chat';

type Props = {
  isAdmin: boolean;
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
 * - チャットルームを削除する： Owner, DMの場合はNormalも可能
 * - チャットルームを退出する： 全てのユーザーが実行可能
 * - adminを設定する：Owner
 * - Passwordを変更、削除、追加する：Owner
 * - friendを入室させる：PrivateかつOwnerのみ
 * - ミュートする：Owner, Admin（DMでは表示しない）
 * - BANする：Owner, Admin（DMでは表示しない）
 * - Kickする：Owner, Admin (DMでは表示しない)
 */
export const ChatroomSettingItems = memo(function ChatroomSettingItems({
  isAdmin,
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
      <MenuItem value={ChatroomSetting.LEAVE_ROOM}>
        {ChatroomSetting.LEAVE_ROOM}
      </MenuItem>
      {(isAdmin || isOwner) && (
        <MenuItem value={ChatroomSetting.MUTE_USER}>
          {ChatroomSetting.MUTE_USER}
        </MenuItem>
      )}
      {(isAdmin || isOwner) && (
        <MenuItem value={ChatroomSetting.UNMUTE_USER}>
          {ChatroomSetting.UNMUTE_USER}
        </MenuItem>
      )}
      {(isAdmin || isOwner) && (
        <MenuItem value={ChatroomSetting.BAN_USER}>
          {ChatroomSetting.BAN_USER}
        </MenuItem>
      )}
      {(isAdmin || isOwner) && (
        <MenuItem value={ChatroomSetting.UNBAN_USER}>
          {ChatroomSetting.UNBAN_USER}
        </MenuItem>
      )}
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
      {/* パスワードで保護されたルームのみ選択可能 */}
      {isOwner && roomType === ChatroomType.PROTECTED && (
        <MenuItem value={ChatroomSetting.DELETE_PASSWORD}>
          {ChatroomSetting.DELETE_PASSWORD}
        </MenuItem>
      )}
      {/* 公開されたルームのみ選択可能 */}
      {isOwner && roomType === ChatroomType.PUBLIC && (
        <MenuItem value={ChatroomSetting.ADD_PASSWORD}>
          {ChatroomSetting.ADD_PASSWORD}
        </MenuItem>
      )}
      {/* 非公開のルームのみフレンド追加ボタンが選択可能 */}
      {isOwner && roomType === ChatroomType.PRIVATE && (
        <MenuItem value={ChatroomSetting.ADD_FRIEND}>
          {ChatroomSetting.ADD_FRIEND}
        </MenuItem>
      )}
      {(isAdmin || isOwner) && (
        <MenuItem value={ChatroomSetting.KICK_USER}>
          {ChatroomSetting.KICK_USER}
        </MenuItem>
      )}
    </Select>
  );
});
