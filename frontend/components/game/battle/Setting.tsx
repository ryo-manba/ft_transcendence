import {
  CircularProgress,
  Grid,
  Button,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { useGameSettingStore } from 'store/game/GameSetting';
import { PlayState, usePlayStateStore } from 'store/game/PlayState';
import { DifficultyLevel, isDifficultyLevel, GameSetting } from 'types/game';

export const Setting = () => {
  const { playState } = usePlayStateStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const updateGameSetting = useGameSettingStore(
    (store) => store.updateGameSetting,
  );
  const { socket } = useSocketStore();
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Easy');
  const [matchPoint, setMatchPoint] = useState(3);
  const durationOfSettingInSec = 30;
  const timeoutIntervalInMilSec = 1000;
  const [countDown, updateCountDown] = useState(durationOfSettingInSec);

  const handleDifficultySetting = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value: unknown = e.target.value;
    if (isDifficultyLevel(value)) {
      setDifficulty(value);
    }
  };

  const handleMatchPointSetting = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMatchPoint(+e.target.value);
  };

  useEffect(() => {
    socket.on('playStarted', (newSetting: GameSetting) => {
      updateGameSetting(newSetting);
      updatePlayState(PlayState.statePlaying);
    });

    socket.on('error', () => {
      updatePlayState(PlayState.stateNothing);
    });

    socket.on('canceled', () => {
      updatePlayState(PlayState.stateCanceled);
    });

    return () => {
      socket.off('playStarted');
      socket.off('error');
      socket.off('canceled');
    };
  }, [socket]);

  useEffect(() => {
    if (0 < countDown) {
      setTimeout(() => {
        updateCountDown(countDown - 1);
      }, timeoutIntervalInMilSec);
    } else if (countDown === 0) {
      socket.emit('cancel');
      updatePlayState(PlayState.stateCanceled);
    }
  }, [countDown, socket]);

  const handleSubmit = () => {
    socket.emit('completeSetting', { difficulty, matchPoint });
  };

  return (
    <Grid item>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        direction="column"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          width: '25%',
          height: '25%',
        }}
      >
        {playState === PlayState.stateStandingBy && (
          <>
            <Grid item>
              <CircularProgress />
            </Grid>
            <Grid item sx={{ mt: 3 }}>
              <Typography
                variant="h6"
                id="modal-modal-title"
                align="center"
                gutterBottom
              >
                The battle is about to start...
              </Typography>
            </Grid>
          </>
        )}
        {playState === PlayState.stateSelecting && (
          <Grid item>
            <Grid
              container
              direction="column"
              justifyContent="center"
              alignItems="center"
            >
              <Grid item>
                <Typography variant="h5"> Remaining Time</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h5">{countDown}</Typography>
              </Grid>
            </Grid>
            <FormControl>
              <FormLabel id="difficulty-radio-buttons-group-label">
                Difficulty
              </FormLabel>
              <RadioGroup
                row
                aria-labelledby="difficulty-radio-buttons-group-label"
                defaultValue="Easy"
                name="difficulty-buttons-group"
                value={difficulty}
                onChange={handleDifficultySetting}
              >
                <FormControlLabel
                  value="Easy"
                  control={<Radio />}
                  label="Easy"
                />
                <FormControlLabel
                  value="Normal"
                  control={<Radio />}
                  label="Normal"
                />
                <FormControlLabel
                  value="Hard"
                  control={<Radio />}
                  label="Hard"
                />
              </RadioGroup>
              <FormLabel id="matchpoint-radio-buttons-group-label">
                Match Point
              </FormLabel>
              <RadioGroup
                row
                aria-labelledby="matchpoint-radio-buttons-group-label"
                defaultValue="3"
                name="matchpoint-buttons-group"
                value={matchPoint}
                onChange={handleMatchPointSetting}
              >
                <FormControlLabel value="3" control={<Radio />} label="3" />
                <FormControlLabel value="5" control={<Radio />} label="5" />
                <FormControlLabel value="10" control={<Radio />} label="10" />
              </RadioGroup>
            </FormControl>
            <Grid
              container
              direction="column"
              justifyContent="center"
              alignItems="center"
            >
              <Button variant="contained" onClick={handleSubmit}>
                Start battle!
              </Button>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};
