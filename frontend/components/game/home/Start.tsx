import VideogameAssetSharpIcon from '@mui/icons-material/VideogameAssetSharp';
import { Button, Grid, TextField } from '@mui/material';
import React, { useContext, useRef } from 'react';
import {
  usePlayStateStore,
  stateWaiting,
} from '../../../store/game/home/PlayState';
import { Context } from './Display';

export const Start = () => {
  const playerNameRef = useRef<HTMLInputElement>(null);
  const clientSocket = useContext(Context);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);

  const start = () => {
    clientSocket.socket?.emit('playStart', playerNameRef.current?.value);
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
          <b>Battle</b>
        </Button>
      </Grid>
    </>
  );
};
