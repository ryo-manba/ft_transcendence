import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
  Avatar,
  Alert,
  AlertTitle,
  Pagination,
} from '@mui/material';
import { LoginUser } from 'types/user';
import { getRecordsById } from 'api/records/getRecordsById';
import { getUserById } from 'api/user/getUserById';
import { Loading } from 'components/common/Loading';
import { useEffect, useState } from 'react';
import { GameRecordWithUserName } from 'types/game';

type Props = {
  userId: number;
};

export const History = ({ userId }: Props) => {
  const [user, setUser] = useState<LoginUser | undefined>();
  const [userError, setUserError] = useState<Error | undefined>(undefined);
  const [records, setRecords] = useState<GameRecordWithUserName[] | undefined>(
    undefined,
  );
  const [recordsError, setRecordsError] = useState<Error | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    let ignore = false;

    const updateRecordsNUser = async (ignore: boolean) => {
      await getRecordsById({ userId })
        .then((res) => {
          if (!ignore) {
            setRecords(res);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setRecordsError(err as Error);
          }
        });

      await getUserById({ userId })
        .then((res) => {
          if (!ignore) {
            setUser(res);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setUserError(err as Error);
          }
        });
    };

    void updateRecordsNUser(ignore);

    return () => {
      ignore = true;
    };
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

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const take = 5;

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        History
      </Typography>
      <List
        sx={{ width: '95%', margin: 'auto', height: '310px', overflow: 'auto' }}
      >
        {records.slice((page - 1) * take, page * take).map((item, index) => (
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
      <Pagination
        count={Math.ceil(records.length / take)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          textAlign: 'center',
        }}
        page={page}
        onChange={handleChange}
      />
    </>
  );
};
