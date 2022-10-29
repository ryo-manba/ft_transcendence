import VisibilityIcon from '@mui/icons-material/Visibility';
import { List, ListItemText, ListItem, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSocketStore } from '../../../store/game/ClientSocket';

type RoomInfo = {
  roomName: string;
  name1: string;
  name2: string;
};

export const Watch = () => {
  const { socket } = useSocketStore();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  useEffect(() => {
    socket?.emit('watchList');
    socket?.on('watchListed', (arg: string) => {
      setRooms(JSON.parse(arg) as RoomInfo[]);
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
            secondaryAction={<VisibilityIcon />}
          >
            <ListItemText primary={`${room.name1} vs ${room.name2}`} />
          </ListItem>
        ))}
      </List>
    </>
  );
};
