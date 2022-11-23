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
  Alert,
  Box,
  Collapse,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { Chatroom } from 'types/chat';
import { Socket } from 'socket.io-client';
import { useQueryUser } from 'hooks/useQueryUser';

type Props = {
  room: Chatroom;
  socket: Socket;
  setCurrentRoomId: (id: number) => void;
};

export const ChatroomListItem = ({ room, socket, setCurrentRoomId }: Props) => {
  const [open, setOpen] = useState(false);
  const { data: user } = useQueryUser();
  if (user === undefined) {
    return <h1>ユーザーが存在しません</h1>;
  }

  const getMessage = (id: number) => {
    console.log('getMessage:', id);
    socket.emit('chat:getMessage', id);
    setCurrentRoomId(id);
  };

  const deleteRoom = (id: number) => {
    console.log('deleteRoom:', id);
    const deleteRoomInfo = {
      id: id,
      userId: user.id,
    };
    socket.emit('chat:deleteRoom', deleteRoomInfo);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const [warning, setWarning] = useState(false);
  const handleDelete = () => {
    handleClose();

    // TODO: adminのハンドリングもチェックする
    // TODO: そもそも削除ボタンを表示しない
    if (user.id !== room.ownerId) {
      setWarning(true);
    } else {
      deleteRoom(room.id);
    }
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Collapse in={warning}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setWarning(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {room.name} could not be deleted.
          </Alert>
        </Collapse>
      </Box>
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
            getMessage(room.id);
          }}
          style={{
            overflow: 'hidden',
          }}
        />
      </ListItem>
    </>
  );
};
