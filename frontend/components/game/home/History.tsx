import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useQueryGameRecords } from 'hooks/useQueryGameRecords';
import { useQueryUser } from 'hooks/useQueryUser';

export const History = () => {
  const { data: records } = useQueryGameRecords();
  const { data: user } = useQueryUser();

  if (records === undefined || user === undefined) return <></>;

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        History
      </Typography>
      <List
        sx={{ width: '95%', margin: 'auto', height: '70%', overflow: 'auto' }}
      >
        {records.map((item, index) => (
          <ListItem key={index} sx={{ border: '1px solid' }}>
            <ListItemAvatar>
              {item.winner.name === user.name ? (
                <KeyboardArrowUpIcon color="success" />
              ) : (
                <KeyboardArrowDownIcon color="error" />
              )}
            </ListItemAvatar>
            {item.winner.name === user.name ? (
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
              primary={`${item.winner.name}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
              sx={{ width: '30%' }}
            />
            <ListItemText
              primary={`${item.winnerScore} - ${item.loserScore}`}
              primaryTypographyProps={{
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
            />
            <ListItemText
              primary={`${item.loser.name}`}
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
