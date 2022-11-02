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
  const myName = 'YEAH';
  const gameHistory: GameHistory[] = [
    {
      opponentName: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      opponentScore: 3,
      myScore: 2,
      status: 'LOSE',
      color: 'error.main',
    },
    {
      opponentName: 'PLAYER1',
      opponentScore: 1,
      myScore: 3,
      status: 'WIN',
      color: 'success.main',
    },
    {
      opponentName: 'PLAYER2',
      opponentScore: 1,
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
            <ListItemAvatar>
              {item.status === 'WIN' ? (
                <KeyboardArrowUpIcon color="success" />
              ) : (
                <KeyboardArrowDownIcon color="error" />
              )}
            </ListItemAvatar>
            {item.status === 'WIN' ? (
              <ListItemText
                primaryTypographyProps={{
                  align: 'left',
                  color: 'success.main',
                }}
                sx={{ width: '6%' }}
                primary={'WIN'}
              />
            ) : (
              <ListItemText
                primaryTypographyProps={{
                  align: 'left',
                  color: 'error.main',
                }}
                sx={{ width: '6%' }}
                primary={'LOSE'}
              />
            )}
            <ListItemText
              primary={`${myName}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
              sx={{ width: '30%' }}
            />
            <ListItemText
              primary={`${item.myScore} - ${item.opponentScore}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
            />
            <ListItemText
              primary={`${item.opponentName}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
              sx={{ width: '30%' }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};
