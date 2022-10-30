import VideogameAssetSharpIcon from '@mui/icons-material/VideogameAssetSharp';
import { Button, Grid, TextField, Box } from '@mui/material';
import React, { useRef } from 'react';
import {
  usePlayStateStore,
  stateWaiting,
} from '../../../store/game/home/PlayState';
import { useSocketStore } from '../../../store/game/ClientSocket';

export const Start = () => {
  const playerNameRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocketStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);

  const start = () => {
    socket?.emit('playStart', playerNameRef.current?.value);
    updatePlayState(stateWaiting);
  };

  return (
    <>
      <Grid item xs={12}>
        <TextField label="name" inputRef={playerNameRef} />
      </Grid>
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
            boxShadow: 8,
          }}
        >
          <Box fontWeight="fontWeightBold">Battle</Box>
        </Button>
      </Grid>
    </>
  );
};
