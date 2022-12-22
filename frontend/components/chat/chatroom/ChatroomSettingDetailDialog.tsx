import { memo } from 'react';
import {
  DialogContent,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  FormControl,
} from '@mui/material';
import { ChatUser } from 'types/chat';

type Props = {
  users: ChatUser[];
  labelTitle: string;
  selectedValue: string;
  onChange: (event: SelectChangeEvent) => void;
};

export const ChatroomSettingDetailDialog = memo(
  function ChatroomSettingDetailDialog({
    users,
    labelTitle,
    selectedValue,
    onChange,
  }: Props) {
    return (
      <>
        {users.length === 0 ? (
          <div
            className="mb-4 flex justify-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-200 dark:text-red-800"
            role="alert"
          >
            <span className="font-medium">No users are available.</span>
          </div>
        ) : (
          <DialogContent>
            <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
              <InputLabel id="room-setting-select-label">
                {labelTitle}
              </InputLabel>
              <Select
                labelId="room-setting-select-label"
                id="room-setting"
                value={selectedValue}
                label="setting"
                onChange={onChange}
              >
                {users.map((user) => (
                  <MenuItem value={String(user.id)} key={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
        )}
      </>
    );
  },
);
