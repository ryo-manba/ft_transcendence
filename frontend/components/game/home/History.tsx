import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
  Avatar,
} from '@mui/material';
import { useQueryGameRecords } from 'hooks/useQueryGameRecords';
import { useQueryUser } from 'hooks/useQueryUser';

export const History = () => {
  const { data: user } = useQueryUser();
  const { data: records } = useQueryGameRecords(user?.id);

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
            <ListItemText
              primary={user.name}
              primaryTypographyProps={{
                variant: 'h6',
                align: 'center',
                style: {
                  overflow: 'hidden',
                },
              }}
              sx={{ width: '30%' }}
            />
            {item.winner.name === user.name ? (
              <>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: 'text.primary',
                      margin: 'auto',
                    }}
                    variant="rounded"
                  >
                    {item.winnerScore}
                  </Avatar>
                </ListItemAvatar>
                <ListItemAvatar>
                  <Avatar variant="rounded" sx={{ margin: 'auto' }}>
                    {item.loserScore}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.loser.name}
                  primaryTypographyProps={{
                    variant: 'h6',
                    align: 'center',
                    style: {
                      overflow: 'hidden',
                    },
                  }}
                  sx={{ width: '30%' }}
                />
              </>
            ) : (
              <>
                <ListItemAvatar>
                  <Avatar variant="rounded" sx={{ margin: 'auto' }}>
                    {item.loserScore}
                  </Avatar>
                </ListItemAvatar>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: 'text.primary', margin: 'auto' }}
                    variant="rounded"
                  >
                    {item.winnerScore}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.winner.name}
                  primaryTypographyProps={{
                    variant: 'h6',
                    align: 'center',
                    style: {
                      overflow: 'hidden',
                    },
                  }}
                  sx={{ width: '30%' }}
                />
              </>
            )}
          </ListItem>
        ))}
      </List>
    </>
  );
};
