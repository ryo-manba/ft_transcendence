import VideogameAssetSharpIcon from '@mui/icons-material/VideogameAssetSharp';
import { Button, Grid, Box, Typography } from '@mui/material';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';

export const Start = () => {
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { data: user } = useQueryUser();

  if (user === undefined) return <Loading />;

  const start = () => {
    socket.emit('playStart', user.id);
    updatePlayState(PlayState.stateWaiting);
  };

  return (
    <>
      <Typography variant="h2" align="center" gutterBottom>
        New Game!!
      </Typography>
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
    </>
  );
};
