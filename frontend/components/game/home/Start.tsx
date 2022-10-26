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
      <Grid item>
        <TextField label="name" inputRef={playerNameRef} />
      </Grid>
      <Grid item>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            start();
          }}
          endIcon={<VideogameAssetSharpIcon />}
          sx={{
            mt: 3,
          }}
        >
          <b>Battle!!</b>
        </Button>
      </Grid>
    </>
  );
};
