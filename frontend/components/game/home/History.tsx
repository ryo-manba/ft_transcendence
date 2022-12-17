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
import { User } from '@prisma/client';
import { getRecordsById } from 'api/records/getRecordsById';
import { getUserById } from 'api/user/getUserById';
import { Loading } from 'components/common/Loading';
import { useEffect, useState } from 'react';
import { GameRecordWithUserName } from 'types/game';

type Props = {
  userId: number;
};

export const History = ({ userId }: Props) => {
  const [user, setUser] = useState<Omit<User, 'hashedPassword'> | undefined>();
  const [userError, setUserError] = useState<Error | undefined>(undefined);
  const [records, setRecords] = useState<GameRecordWithUserName[] | undefined>(
    undefined,
  );
  const [recordsError, setRecordsError] = useState<Error | undefined>(
    undefined,
  );

  useEffect(() => {
    const updateRecordsNUser = async () => {
      await getRecordsById({ userId })
        .then((res) => {
          setRecords(res);
        })
        .catch((err) => {
          setRecordsError(err as Error);
        });
      await getUserById({ userId })
        .then((res) => {
          setUser(res);
        })
        .catch((err) => {
          setUserError(err as Error);
        });
    };

    void updateRecordsNUser();
  }, []);

  if (userError !== undefined || recordsError !== undefined) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {userError !== undefined && <p>User Fetching Error</p>}
        {records !== undefined && <p>Game Records Fetching Error</p>}
      </Alert>
    );
  }

  if (records === undefined || user === undefined) {
    return <Loading />;
  }

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
            {item.winnerName === user.name ? (
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
                  primary={item.loserName}
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
                  primary={item.winnerName}
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
