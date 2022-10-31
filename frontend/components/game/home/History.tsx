import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

type GameHistory = {
  opponentName: string;
  opponentScore: number;
  myScore: number;
  status: 'WIN' | 'LOSE';
  color: 'success.main' | 'error.main';
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
      color: 'success.main',
    },
    {
      opponentName: 'BUCCI',
      opponentScore: 2,
      myScore: 3,
      status: 'WIN',
      color: 'success.main',
    },
  ];

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        History
      </Typography>
      <List sx={{ width: '95%', margin: 'auto' }}>
        {gameHistory?.map((item, index) => (
          <ListItem key={index} sx={{ border: '1px solid' }}>
            <ListItemAvatar
              sx={{
                mr: 2,
              }}
            >
              {item.status === 'WIN' ? (
                <KeyboardArrowUpIcon color="primary" />
              ) : (
                <KeyboardArrowDownIcon color="primary" />
              )}
            </ListItemAvatar>
            <ListItemText
              primaryTypographyProps={{
                color: `${item.color}`,
              }}
              primary={`${item.status}`}
            />
            <ListItemText primary={`${myName}`} />
            <ListItemText primary={`${item.myScore} - ${item.opponentScore}`} />
            <ListItemText primary={`${item.opponentName}`} />
          </ListItem>
        ))}
      </List>
    </>
  );
};
