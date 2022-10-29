import VideogameAssetSharpIcon from '@mui/icons-material/VideogameAssetSharp';
import { Button, Grid, TextField } from '@mui/material';
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
