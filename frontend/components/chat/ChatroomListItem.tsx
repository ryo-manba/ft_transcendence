import { ListItem, IconButton, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Chatroom } from 'types/chat';

type Props = {
  room: Chatroom;
  joinRoom: (id: number) => void;
};

export const ChatroomListItem = ({ room, joinRoom }: Props) => {
  if (room === undefined) {
    return null;
  }

  return (
    <ListItem
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => {
            // TODO: チャットルームを削除する
            console.log('click delete');
          }}
        >
          <DeleteIcon />
        </IconButton>
      }
      divider
      button
    >
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
