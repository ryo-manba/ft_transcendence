import type { NextPage } from 'next';
import { Layout } from 'components/common/Layout';
import { Display } from 'components/game/home/Display';
import { Header } from 'components/common/Header';
import { useSocketStore } from 'store/game/ClientSocket';
import Debug from 'debug';
import { PlayState, usePlayStateStore } from 'store/game/PlayState';
import { useEffect, useState } from 'react';
import { Alert, Snackbar, Typography } from '@mui/material';

const Home: NextPage = () => {
  const { socket } = useSocketStore();
  const debug = Debug('game');
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const [isSSValidationError, setIsSSValidationError] = useState(false);

  useEffect(() => {
    // バックエンドのvalidation errorをキャッチ
    socket.on('exception', (data: { status: string; message: string }) => {
      debug('receive exception: %o', data);
      setIsSSValidationError(true);
      updatePlayState(PlayState.stateNothing);
    });

    return () => {
      socket.off('exception');
    };
  });

  const handleSnackClose = () => {
    setIsSSValidationError(false);
  };

  return (
    <Layout title="Game">
      <Header title="Game" />
      <Display />
      <Snackbar
        open={isSSValidationError}
        autoHideDuration={6000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackClose} severity="error">
          <Typography variant="body2">Something went wrong...</Typography>
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default Home;
