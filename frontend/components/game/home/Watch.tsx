import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  List,
  ListItemText,
  ListItem,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useMutationStatus } from 'hooks/useMutationStatus';
import { useQueryUser } from 'hooks/useQueryUser';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { useGameSettingStore } from 'store/game/GameSetting';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { PlayState, usePlayStateStore } from 'store/game/PlayState';
import { GameSetting } from 'types/game';

type WatchInfo = {
  roomName: string;
  name1: string;
  name2: string;
};

type GameState = 'Setting' | 'Playing';

export const Watch = () => {
  const { socket } = useSocketStore();
  const [rooms, setRooms] = useState<WatchInfo[]>([]);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updatePlayerNames = usePlayerNamesStore(
    (store) => store.updatePlayerNames,
  );
  const updateGameSetting = useGameSettingStore(
    (store) => store.updateGameSetting,
  );
  const router = useRouter();
  const { data: user } = useQueryUser();
  const { updateStatusMutation } = useMutationStatus();

  useEffect(() => {
    if (user === undefined) return;

    socket.emit('watchList');
    socket.on('watchListed', (data: WatchInfo[]) => {
      setRooms(
        data.filter(
          (elem) => elem.name1 !== user.name && elem.name2 !== user.name,
        ),
      );
    });
    const intervalId = setInterval(() => {
      socket.emit('watchList');
    }, 2000);

    socket.on(
      'joinGameRoom',
      (gameState: GameState, gameSetting: GameSetting) => {
        console.log('joinGameRoom');
        if (user === undefined) {
          return;
        }
        try {
          updateStatusMutation.mutate({
            userId: user.id,
            status: 'PLAYING',
          });
        } catch (error) {
          return;
        }
        if (gameState === 'Setting') {
          updatePlayState(PlayState.stateStandingBy);
        } else {
          updatePlayState(PlayState.statePlaying);
          updateGameSetting(gameSetting);
        }
        void router.push('/game/battle');
      },
    );

    return () => {
      clearInterval(intervalId);
      socket.off('watchListed');
      socket.off('joinGameRoom');
    };
  }, [socket, user]);

  const watchGame = (room: WatchInfo) => {
    const playerNames: [string, string] = [room.name1, room.name2];
    socket.emit('watchGame', room.roomName);
    updatePlayerNames(playerNames);
  };

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        Ongoing Battles
      </Typography>
      <List sx={{ width: '95%', margin: 'auto' }}>
        {rooms?.map((room) => (
          <ListItem
            key={room.roomName}
            sx={{ border: '1px solid' }}
            secondaryAction={
              <Tooltip title="Watch !">
                <IconButton
                  onClick={() => {
                    watchGame(room);
                  }}
                >
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
                variant: 'h6',
              }}
              sx={{ width: '40%' }}
            />
            <ListItemText
              primary={`vs`}
              primaryTypographyProps={{
                align: 'center',
                variant: 'h6',
              }}
            />
            <ListItemText
              primary={`${room.name2}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
                variant: 'h6',
              }}
              sx={{ width: '40%' }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};
