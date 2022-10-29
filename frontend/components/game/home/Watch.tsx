import VisibilityIcon from '@mui/icons-material/Visibility';
import { List, ListItemText, ListItem, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Context } from './Display';

type RoomInfo = {
  roomName: string;
  playerName1: string;
  playerName2: string;
};

export const Watch = () => {
  const clientSocket = useContext(Context);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  useEffect(() => {
    clientSocket.socket?.emit('watchList');
    clientSocket.socket?.on('watchListed', (arg: string) => {
      setRooms(JSON.parse(arg) as RoomInfo[]);
    });
    const id = setInterval(() => {
      clientSocket.socket?.emit('watchList');
    }, 2000);

    return () => clearInterval(id);
  }, [clientSocket.socket]);

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
            <ListItemText
              primary={`${room.playerName1} vs ${room.playerName2}`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};
