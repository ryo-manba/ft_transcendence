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
import { useSocketStore } from 'store/game/ClientSocket';

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
      <Typography variant="h2" align="center" gutterBottom>
        Current Rooms
      </Typography>
      <List sx={{ width: '95%', margin: 'auto' }}>
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
            <ListItemText
              primary={`${room.name1}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
              sx={{ width: '40%' }}
            />
            <ListItemText
              primary={`vs`}
              primaryTypographyProps={{
                align: 'center',
              }}
            />
            <ListItemText
              primary={`${room.name2}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
              sx={{ width: '40%' }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};
