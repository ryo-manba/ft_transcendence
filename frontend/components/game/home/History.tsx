import {
  List,
  ListItem,
  ListItemText,
  Box,
  ListItemAvatar,
  Typography,
} from '@mui/material';

type GameHistory = {
  opponentName: string;
  opponentScore: number;
  myScore: number;
  status: 'WIN' | 'LOSE';
  color: 'primary.main' | 'error.main';
};

export const History = () => {
  // [TODO] replace with DB data
  const myName = 'shigechi';
  const gameHistory: GameHistory[] = [
    {
      opponentName: 'JOJO',
      opponentScore: 3,
      myScore: 2,
      status: 'LOSE',
      color: 'error.main',
    },
    {
      opponentName: 'DIO',
      opponentScore: 1,
      myScore: 3,
      status: 'WIN',
      color: 'primary.main',
    },
    {
      opponentName: 'BUCCI',
      opponentScore: 2,
      myScore: 3,
      status: 'WIN',
      color: 'primary.main',
    },
  ];

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        History
      </Typography>
      <List>
        {gameHistory?.map((item, index) => (
          <ListItem key={index} sx={{ border: '1px solid' }}>
            <ListItemAvatar sx={{ color: 'error' }}>
              <Box color={item.color}>{item.status}</Box>
            </ListItemAvatar>
            <ListItemText
              primary={`${myName} ${item.myScore} - ${item.opponentScore} ${item.opponentName}`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};
