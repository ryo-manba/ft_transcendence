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
import { PlayState, usePlayStateStore } from 'store/game/PlayState';
import { useGameSettingStore } from 'store/game/GameSetting';

const difficultyLevelArray = ['Eary', 'Normal', 'Hard'];

type DifficultyLevel = typeof difficultyLevelArray[number];

const isDifficultyLevel = (value: unknown): value is DifficultyLevel => {
  return typeof value === 'string' && difficultyLevelArray.includes(value);
};

export const Setting = () => {
  const { playState } = usePlayStateStore();
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const { socket } = useSocketStore();
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Easy');
  const [matchPoint, setMatchPoint] = useState(3);
  const updateGameSetting = useGameSettingStore(
    (store) => store.updateGameSetting,
  );

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
    socket?.on('playStarted', (data: [string, number]) => {
      updatePlayState(PlayState.statePlaying);
      updateGameSetting(data);
    });

    return () => {
      socket?.off('playStarted');
    };
  }, [socket]);

  const handleSubmit = () => {
    socket?.emit('completeSetting', [difficulty, matchPoint]);
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
            <Button onClick={handleSubmit}>Start battle!</Button>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};
