import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
  Avatar,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Loading } from 'components/common/Loading';
import { useQueryGameRecords } from 'hooks/useQueryGameRecords';
import { useQueryUserById } from 'hooks/useQueryUserById';

type Props = {
  userId: number;
};

export const History = ({ userId }: Props) => {
  const { data: user, error: userQueryError } = useQueryUserById(userId);
  const { data: records, error: recordQueryError } = useQueryGameRecords(
    user?.id,
  );

  if (userQueryError || recordQueryError) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {userQueryError && `User fetching error: ${userQueryError.message}`}
        {recordQueryError &&
          `Game record fetching error: ${recordQueryError.message}`}
      </Alert>
    );
  }

  if (records === undefined || user === undefined) return <Loading />;

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
                      bgcolor: 'success.main',
                      margin: 'auto',
                    }}
                    variant="rounded"
                  >
                    {item.winnerScore}
                  </Avatar>
                </ListItemAvatar>
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    sx={{ bgcolor: 'error.main', margin: 'auto' }}
                  >
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
                  <Avatar
                    variant="rounded"
                    sx={{ bgcolor: 'error.main', margin: 'auto' }}
                  >
                    {item.loserScore}
                  </Avatar>
                </ListItemAvatar>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: 'success.main', margin: 'auto' }}
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
