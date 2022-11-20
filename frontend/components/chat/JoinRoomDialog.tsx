import { memo } from 'react';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  DialogTitle,
  Dialog,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import ChatIcon from '@mui/icons-material/Chat';
import LockIcon from '@mui/icons-material/Lock';
import { Chatroom } from '@prisma/client';
import { CHATROOM_TYPE, ChatroomType } from 'types/chat';

type SimpleDialogProps = {
  open: boolean;
  rooms: Chatroom[];
  selectedValue: string;
  onClose: (value: string) => void;
};

export const JoinRoomDialog = memo(function JoinRoomDialog({
  onClose,
  selectedValue,
  rooms,
  open,
}: SimpleDialogProps) {
  const handleClose = () => {
    onClose(selectedValue);
  };

  const handleListItemClick = (value: string) => {
    onClose(value);
  };

  const isProtected = (type: ChatroomType) => {
    return type == CHATROOM_TYPE.PROTECTED;
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Chatrooms</DialogTitle>
      <List sx={{ pt: 0 }}>
        {rooms.map((room, i) => (
          <ListItem
            button
            onClick={() => handleListItemClick(room.name)}
            key={i}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
                {(isProtected(room.type) && <LockIcon />) || <ChatIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={room.name} />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
});
