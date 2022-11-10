import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';

type ChatRoom = {
  id: number;
  name: string;
  type: boolean;
  author: string;
  hashedPassword?: string;
};

type Props = {
  room: ChatRoom;
  joinRoom: (id: number) => void;
};

export const ChatRoomListItem = ({ room, joinRoom }: Props) => {
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
