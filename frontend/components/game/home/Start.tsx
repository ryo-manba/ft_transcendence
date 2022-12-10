import VideogameAssetSharpIcon from '@mui/icons-material/VideogameAssetSharp';
import { Button, Grid, Box, Typography } from '@mui/material';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { updateUserStatusById } from 'api/user/updateUserStatusById';

export const Start = () => {
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { data: user } = useQueryUser();

  if (user === undefined) return <Loading />;

  const start = () => {
    const startGame = async () => {
      const res = await updateUserStatusById({
        userId: user.id,
        status: 'PLAYING',
      });
      if (!res) return;
      socket.emit('playStart', user.id);
      updatePlayState(PlayState.stateWaiting);
    };

    void startGame();
  };

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
