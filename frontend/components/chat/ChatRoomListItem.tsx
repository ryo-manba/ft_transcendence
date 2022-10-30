import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';

type Props = {
  name: string;
};

export const ChatRoomListItem = ({ name }: Props) => {
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
        primary={name}
        onClick={() => {
          // TODO: チャットルームに入る
          console.log('click text');
        }}
      />
    </ListItem>
  );
};
