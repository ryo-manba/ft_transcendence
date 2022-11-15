import { useState } from 'react';
import {
  ListItem,
  IconButton,
  ListItemText,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Chatroom } from 'types/chat';
import { Socket } from 'socket.io-client';

type Props = {
  room: Chatroom;
  socket: Socket;
  setCurrentRoomId: (id: number) => void;
};

export const ChatroomListItem = ({ room, socket, setCurrentRoomId }: Props) => {
  const [open, setOpen] = useState(false);

  const joinRoom = (id: number) => {
    console.log('joinRoom:', id);
    const res = socket.emit('chat:joinRoom', id);
    if (res) {
      setCurrentRoomId(id);
    }
    console.log(id);
  };

  const deleteRoom = (id: number) => {
    console.log('deleteRoom:', id);
    const res = socket.emit('chat:deleteRoom', id);
    if (res) {
      // const initialRoomId = 0;
      // setCurrentRoomId(initialRoomId);
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = () => {
    handleClose();
    deleteRoom(room.id);
  };

  return (
    <ListItem
      secondaryAction={
        <IconButton edge="end" aria-label="delete" onClick={handleClickOpen}>
          <DeleteIcon />
        </IconButton>
      }
      divider
      button
    >
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Room?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {`Do you really want to delete the Room '${room.name}'?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Disagree</Button>
          <Button onClick={handleDelete} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
      <ListItemText
        primary={room.name}
        onClick={() => {
          joinRoom(room.id);
        }}
        style={{
          overflow: 'hidden',
        }}
      />
    </ListItem>
  );
};
