import VideogameAssetSharpIcon from '@mui/icons-material/VideogameAssetSharp';
import { Button, Grid, TextField, Box, Typography } from '@mui/material';
import React, { useRef } from 'react';
import { usePlayStateStore, stateWaiting } from 'store/game/PlayState';
import { useSocketStore } from 'store/game/ClientSocket';

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
      <Typography variant="h2" align="center" gutterBottom>
        Play Game!!
      </Typography>
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
