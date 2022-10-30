import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  List,
  ListItemText,
  ListItem,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSocketStore } from '../../../store/game/ClientSocket';

type WatchInfo = {
  roomName: string;
  name1: string;
  name2: string;
};

export const Watch = () => {
  const { socket } = useSocketStore();
  const [rooms, setRooms] = useState<WatchInfo[]>([]);

  useEffect(() => {
    socket?.emit('watchList');
    socket?.on('watchListed', (data: WatchInfo[]) => {
      setRooms(data);
    });
    const id = setInterval(() => {
      socket?.emit('watchList');
    }, 2000);

    return () => clearInterval(id);
  }, [socket]);

  return (
    <>
      <Typography variant="h3" align="center" gutterBottom>
        Current Rooms
      </Typography>
      <List>
        {rooms?.map((room) => (
          <ListItem
            key={room.roomName}
            sx={{ border: '1px solid' }}
            secondaryAction={
              <Tooltip title="Watch !">
                <IconButton href="https://github.com/ryo-manba/ft_transcendence">
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemText primary={`${room.name1} vs ${room.name2}`} />
          </ListItem>
        ))}
      </List>
    </>
  );
};
