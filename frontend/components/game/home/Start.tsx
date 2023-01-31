import VideogameAssetSharpIcon from '@mui/icons-material/VideogameAssetSharp';
import { Button, Grid, Box, Typography } from '@mui/material';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { Dispatch, SetStateAction, useCallback } from 'react';

type Props = {
  setOpenMatchError: Dispatch<SetStateAction<boolean>>;
};

export const Start = ({ setOpenMatchError }: Props) => {
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { data: user } = useQueryUser();

  const start = useCallback(() => {
    if (!user) return;

    setOpenMatchError(false);
    updatePlayState(PlayState.stateWaiting);
    socket.emit('playStart', { userId: user.id }, (res: boolean) => {
      if (!res) setOpenMatchError(true);
    });
  }, [socket, setOpenMatchError, updatePlayState, user]);

  if (user === undefined) return <Loading />;

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        New Game!!
      </Typography>
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        direction="column"
        sx={{ height: '100%' }}
      >
        <Grid item xs={12}>
          <Button
            size="large"
            variant="contained"
            color="secondary"
            onClick={() => {
              start();
            }}
            endIcon={<VideogameAssetSharpIcon />}
            sx={{
              mt: 2,
              mb: 2,
              boxShadow: 8,
            }}
          >
            <Box fontWeight="fontWeightBold">Play</Box>
          </Button>
        </Grid>
      </Grid>
    </>
  );
};
