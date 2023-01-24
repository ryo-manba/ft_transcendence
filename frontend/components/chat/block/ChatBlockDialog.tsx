import { memo, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Collapse,
  Select,
  SelectChangeEvent,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import { ChatUser, ChatBlockSetting } from 'types/chat';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { ChatErrorAlert } from 'components/chat/utils/ChatErrorAlert';
import { ChatBlockSettingDetailDialog } from 'components/chat/block/ChatBlockSettingDetailDialog';
import { fetchBlockedUsers } from 'api/chat/fetchBlockedUsers';
import { fetchUnblockedUsers } from 'api/chat/fetchUnblockedUsers';

type Props = {
  socket: Socket;
  open: boolean;
  onClose: () => void;
  removeFriendById: (id: number) => void;
};

export type ChatroomJoinForm = {
  password: string;
};

export const ChatBlockDialog = memo(function ChatBlockDialog({
  socket,
  open,
  onClose,
  removeFriendById,
}: Props) {
  const [selectedBlockSetting, setSelectedBlockSetting] =
    useState<ChatBlockSetting>(ChatBlockSetting.BLOCK_USER);

  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [unblockedUsers, setUnblockedUsers] = useState<ChatUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<ChatUser[]>([]);
  const { data: user } = useQueryUser();

  const setupBlockedUsers = async (userId: number, ignore: boolean) => {
    const blockedUsers = await fetchBlockedUsers({
      userId: userId,
    });
    if (!ignore) {
      setBlockedUsers(blockedUsers);
    }
  };

  const setupUnblockedUsers = async (userId: number, ignore: boolean) => {
    const unblockedUsers = await fetchUnblockedUsers({
      userId: userId,
    });
    if (!ignore) {
      setUnblockedUsers(unblockedUsers);
    }
  };

  // 設定項目を選択した時に対応するユーザ一覧を取得する
  // open時に再取得しないと、初期選択項目のfetchが別項目を選択するまで行われない
  useEffect(() => {
    if (user === undefined || open === false) return;

    let ignore = false;
    setSelectedUserId('');
    switch (selectedBlockSetting) {
      case ChatBlockSetting.BLOCK_USER:
        void setupUnblockedUsers(user.id, ignore);
        break;
      case ChatBlockSetting.UNBLOCK_USER:
        void setupBlockedUsers(user.id, ignore);
        break;
      default:
    }

    return () => {
      ignore = true;
    };
  }, [selectedBlockSetting, open, user]);

  if (user === undefined) {
    return <Loading />;
  }

  const handleClose = () => {
    setSelectedUserId('');
    setError('');
    setSelectedBlockSetting(ChatBlockSetting.BLOCK_USER);
    onClose();
  };

  const handleChangeSetting = (event: SelectChangeEvent) => {
    setSelectedBlockSetting(event.target.value as ChatBlockSetting);
  };

  const handleChangeUserId = (event: SelectChangeEvent) => {
    setSelectedUserId(event.target.value);
  };

  const blockUser = () => {
    const blockUserDto = {
      blockingUserId: Number(selectedUserId),
      blockedByUserId: user.id,
    };

    socket.emit('chat:blockUser', blockUserDto, (res: boolean) => {
      if (!res) {
        setError('Failed to block user.');

        return;
      }
      removeFriendById(Number(selectedUserId));
      handleClose();
    });
  };

  const unblockUser = () => {
    const unblockUserDto = {
      blockingUserId: Number(selectedUserId),
      blockedByUserId: user.id,
    };

    socket.emit('chat:unblockUser', unblockUserDto, (res: boolean) => {
      if (!res) {
        setError('Failed to unblock user.');

        return;
      }
      handleClose();
    });
  };

  const handleSubmit = () => {
    if (selectedUserId === '') return;

    switch (selectedBlockSetting) {
      case ChatBlockSetting.BLOCK_USER:
        blockUser();
        break;
      case ChatBlockSetting.UNBLOCK_USER:
        unblockUser();
        break;
      default:
    }
  };

  const generateButtonName = (type: ChatBlockSetting) => {
    switch (type) {
      case ChatBlockSetting.BLOCK_USER:
        return 'Block';
      case ChatBlockSetting.UNBLOCK_USER:
        return 'Unblock';
      default:
    }
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle sx={{ bgcolor: blue[100] }}>Block Setting</DialogTitle>
      <DialogContent className="mt-2">
        <FormControl sx={{ mx: 3, my: 1, minWidth: 200 }}>
          <InputLabel id="room-setting-select-label">Setting</InputLabel>
          <Select
            labelId="room-setting-select-label"
            id="room-setting"
            value={selectedBlockSetting}
            label="setting"
            onChange={handleChangeSetting}
          >
            <MenuItem value={ChatBlockSetting.BLOCK_USER}>
              {ChatBlockSetting.BLOCK_USER}
            </MenuItem>
            <MenuItem value={ChatBlockSetting.UNBLOCK_USER}>
              {ChatBlockSetting.UNBLOCK_USER}
            </MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      {selectedBlockSetting === ChatBlockSetting.BLOCK_USER && (
        <ChatBlockSettingDetailDialog
          users={unblockedUsers}
          labelTitle="User"
          selectedValue={selectedUserId}
          onChange={handleChangeUserId}
        />
      )}
      {selectedBlockSetting === ChatBlockSetting.UNBLOCK_USER && (
        <ChatBlockSettingDetailDialog
          users={blockedUsers}
          labelTitle="User"
          selectedValue={selectedUserId}
          onChange={handleChangeUserId}
        />
      )}
      <Box sx={{ width: '100%' }}>
        <Collapse in={error !== ''}>
          <ChatErrorAlert error={error} setError={setError} />
        </Collapse>
      </Box>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedUserId === ''}
          variant="contained"
        >
          {generateButtonName(selectedBlockSetting)}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
