import { Grid, Typography, Zoom } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { GameHeader } from 'components/game/battle/GameHeader';
import {
  DifficultyLevel,
  FinishedGameInfo,
  GameInfo,
  GameParameters,
} from 'types/game';
import { useMutationPoint } from 'hooks/useMutationPoint';
import { useQueryUser } from 'hooks/useQueryUser';
import { Loading } from 'components/common/Loading';
import { useGameSettingStore } from 'store/game/GameSetting';
import { useMutationStatus } from 'hooks/useMutationStatus';
import { useRouter } from 'next/router';
import Debug from 'debug';

type Props = {
  updateFinishedGameInfo: (newInfo: FinishedGameInfo) => void;
};

const convert2Int = (float: number) => float - (float % 1);

const DENOMINATOR_FOR_EASY = 6;
const DENOMINATOR_FOR_NORMAL = 12;
const DENOMINATOR_FOR_HARD = 30;

const getBarLength = (
  canvasHeight: number,
  difficultyLevel: DifficultyLevel,
) => {
  switch (difficultyLevel) {
    case DifficultyLevel.EASY:
      return convert2Int(canvasHeight / DENOMINATOR_FOR_EASY);
    case DifficultyLevel.NORMAL:
      return convert2Int(canvasHeight / DENOMINATOR_FOR_NORMAL);
    case DifficultyLevel.HARD:
      return convert2Int(canvasHeight / DENOMINATOR_FOR_HARD);
  }
};

const getGameParameters = (
  canvasWidth: number,
  difficultyLevel: DifficultyLevel,
) => {
  const { innerWidth } = window;
  const topLeftX =
    innerWidth === canvasWidth
      ? 0
      : convert2Int((innerWidth - canvasWidth) / 2);
  const gameParameters: GameParameters = {
    topLeftX,
    canvasWidth,
    canvasHeight: convert2Int(canvasWidth * 0.6),
    barWidth: convert2Int(canvasWidth * 0.02),
    barLength: 0,
    player1X: convert2Int(canvasWidth * 0.02 + topLeftX),
    player2X: convert2Int(canvasWidth * 0.96 + topLeftX),
    highestPos: 0,
    lowestPos: 0,
    sideBarLeft: convert2Int(canvasWidth * 0.05 + topLeftX),
    sideBarRight: convert2Int(canvasWidth * 0.95 + topLeftX),
    lineDashStyle: [20, 5],
    initialHeight: 0,
    ballInitialX: convert2Int(canvasWidth / 2 + topLeftX),
    ballInitialY: 0,
    ballRadius: convert2Int(canvasWidth * 0.01),
    widthRatio: 0,
  };
  gameParameters.barLength = getBarLength(
    gameParameters.canvasHeight,
    difficultyLevel,
  );
  gameParameters.highestPos = convert2Int(gameParameters.canvasHeight / 60);
  gameParameters.lowestPos =
    gameParameters.canvasHeight -
    gameParameters.highestPos -
    gameParameters.barLength;
  gameParameters.initialHeight = convert2Int(
    gameParameters.canvasHeight / 2 - gameParameters.barLength / 2,
  );
  gameParameters.ballInitialY = convert2Int(gameParameters.canvasHeight / 2);
  gameParameters.widthRatio = gameParameters.canvasWidth / 1000; // 1000 is the width of the gameboard in the backend

  return gameParameters;
};

export const Play = ({ updateFinishedGameInfo }: Props) => {
  const debug = Debug('game');

  const getCanvasWidth = () => {
    const { innerWidth, innerHeight } = window;
    const heightOfHeader = 80;
    const heightOfFooter = 25;
    const widthFromHeight = convert2Int(
      (innerHeight - (heightOfHeader * 2 + heightOfFooter)) / 0.6,
    );

    return innerWidth < widthFromHeight ? innerWidth : widthFromHeight;
  };

  const { socket } = useSocketStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playState } = usePlayStateStore();
  const { playerNames } = usePlayerNamesStore();
  const { gameSetting } = useGameSettingStore();
  const updateGameSetting = useGameSettingStore(
    (store) => store.updateGameSetting,
  );
  const [gameParameters, setGameParameters] = useState(
    getGameParameters(getCanvasWidth(), gameSetting.difficulty),
  );
  const [gameInfo, updateGameInfo] = useState<GameInfo>({
    height1: gameParameters.initialHeight,
    height2: gameParameters.initialHeight,
    ball: {
      x: gameParameters.ballInitialX,
      y: gameParameters.ballInitialY,
      radius: gameParameters.ballRadius,
    },
  });
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const [countDown, updateCountDown] = useState(3);
  const [changeCount, updateChangeCount] = useState(true);
  const [isArrowDownPressed, updateIsArrowDownPressed] = useState(false);
  const [isArrowUpPressed, updateIsArrowUpPressed] = useState(false);
  const { updatePointMutation } = useMutationPoint();
  const { updateStatusMutation } = useMutationStatus();
  const { data: user } = useQueryUser();
  const router = useRouter();
  const FPS = 60;
  const waitMillSec = 1000 / FPS;

  const drawField = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      gameInfo: GameInfo,
      params: GameParameters,
    ) => {
      const { innerWidth, innerHeight } = window;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.fillRect(
        params.player1X,
        gameInfo.height1,
        params.barWidth,
        params.barLength,
      );
      ctx.fillRect(
        params.player2X,
        gameInfo.height2,
        params.barWidth,
        params.barLength,
      );

      // draw upper side line
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(params.sideBarLeft, params.highestPos);
      ctx.lineTo(params.sideBarRight, params.highestPos);

      // draw bottom side line
      ctx.moveTo(params.sideBarLeft, params.lowestPos + params.barLength);
      ctx.lineTo(params.sideBarRight, params.lowestPos + params.barLength);
      ctx.stroke();

      // draw center line
      ctx.beginPath();
      ctx.setLineDash(params.lineDashStyle);
      ctx.moveTo(params.canvasWidth / 2 + params.topLeftX, params.highestPos);
      ctx.lineTo(
        params.canvasWidth / 2 + params.topLeftX,
        params.lowestPos + params.barLength,
      );
      ctx.stroke();

      // draw ball
      ctx.beginPath();
      ctx.moveTo(gameInfo.ball.x + params.topLeftX, gameInfo.ball.y);
      ctx.arc(
        gameInfo.ball.x + params.topLeftX,
        gameInfo.ball.y,
        gameInfo.ball.radius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    let animationFrameId: number;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (
        !isArrowDownPressed &&
        !isArrowUpPressed &&
        (key === 'ArrowDown' || key === 'ArrowUp')
      ) {
        if (key === 'ArrowDown') {
          updateIsArrowDownPressed(true);
        } else if (key === 'ArrowUp') {
          updateIsArrowUpPressed(true);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.code;
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        if (isArrowDownPressed) {
          updateIsArrowDownPressed(false);
        } else if (isArrowUpPressed) {
          updateIsArrowUpPressed(false);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const render = () => {
      drawField(context, gameInfo, gameParameters);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    socket.on('updateGameInfo', (newGameInfo: GameInfo) => {
      const rescaledGameInfo: GameInfo = {
        height1: convert2Int(newGameInfo.height1 * gameParameters.widthRatio),
        height2: convert2Int(newGameInfo.height2 * gameParameters.widthRatio),
        ball: {
          x: convert2Int(newGameInfo.ball.x * gameParameters.widthRatio),
          y: convert2Int(newGameInfo.ball.y * gameParameters.widthRatio),
          radius: convert2Int(
            newGameInfo.ball.radius * gameParameters.widthRatio,
          ),
        },
      };
      updateGameInfo(rescaledGameInfo);
    });

    const barMove = () => {
      let move = 0;
      if (countDown === 0) {
        if (isArrowDownPressed || isArrowUpPressed) {
          if (isArrowDownPressed) {
            move = 1;
          } else if (isArrowUpPressed) {
            move = -1;
          }
        }
        socket.emit('barMove', { move });
      }
    };
    const intervalId =
      user !== undefined &&
      (user.name === playerNames[0] || user.name === playerNames[1])
        ? setInterval(barMove, waitMillSec)
        : undefined;

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      if (intervalId !== undefined) clearInterval(intervalId);
      socket.off('updateGameInfo');
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [
    drawField,
    countDown,
    gameInfo,
    gameParameters,
    socket,
    isArrowDownPressed,
    isArrowUpPressed,
    user,
  ]);

  useEffect(() => {
    socket.on('updateScores', (newScores: [number, number]) => {
      updateGameSetting({
        ...gameSetting,
        player1Score: newScores[0],
        player2Score: newScores[1],
      });
    });

    return () => {
      socket.off('updateScores');
    };
  }, [socket]);

  useEffect(() => {
    socket.on(
      'finishGame',
      (updatedPoint: number | null, finishedGameInfo: FinishedGameInfo) => {
        if (user !== undefined) {
          if (updatedPoint !== null) {
            updatePointMutation.mutate(
              { userId: user.id, updatedPoint },
              {
                onError: () => {
                  updatePlayState(PlayState.stateNothing);
                },
              },
            );
          }
          updateStatusMutation.mutate(
            {
              userId: user.id,
              status: 'ONLINE',
            },
            {
              onError: () => {
                updatePlayState(PlayState.stateNothing);
              },
            },
          );
        }
        updateFinishedGameInfo(finishedGameInfo);
        updatePlayState(PlayState.stateFinished);
      },
    );
    socket.on('error', () => {
      try {
        if (user !== undefined) {
          updateStatusMutation.mutate({
            userId: user?.id,
            status: 'ONLINE',
          });
        }
      } catch (error) {
        debug(error);
      }
      updatePlayState(PlayState.stateNothing);
    });

    return () => {
      socket.off('finishGame');
      socket.off('error');
    };
  }, [socket, user]);

  useEffect(() => {
    const handleWindowResize = () => {
      setGameParameters(
        getGameParameters(getCanvasWidth(), gameSetting.difficulty),
      );
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [gameSetting.difficulty]);

  useEffect(() => {
    const cancelOngoingBattle = () => {
      if (playState === PlayState.statePlaying) {
        socket.emit('cancelOngoingBattle');
      }
    };

    router.events.on('routeChangeStart', cancelOngoingBattle);

    return () => {
      router.events.off('routeChangeStart', cancelOngoingBattle);
    };
  }, [socket, playState]);

  useEffect(() => {
    socket.on('cancelOngoingBattle', () => {
      updatePlayState(PlayState.stateCanceled);
    });

    return () => {
      socket.off('cancelOngoingBattle');
    };
  }, [socket]);

  useEffect(() => {
    if (countDown > 0) {
      setTimeout(() => {
        updateChangeCount(false);
      }, 800);
      setTimeout(() => {
        updateCountDown(countDown - 1);
        updateChangeCount(true);
      }, 1000);
    }
  }, [countDown]);

  if (user === undefined) return <Loading fullHeight={true} />;

  return (
    <>
      {countDown !== 0 &&
        (user.name === playerNames[0] || user.name === playerNames[1]) && (
          <Grid
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Zoom in={changeCount}>
              <Typography variant="h1" fontFamily="sans-serif">
                {countDown}
              </Typography>
            </Zoom>
          </Grid>
        )}
      <div>
        <GameHeader left={playerNames[0]} center="VS" right={playerNames[1]} />
        <GameHeader
          left={gameSetting.player1Score}
          center=":"
          right={gameSetting.player2Score}
        />
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={gameParameters.canvasHeight}
        />
        <Typography align="center">{`Difficulty: ${gameSetting.difficulty} / Match Point: ${gameSetting.matchPoint}`}</Typography>
      </div>
    </>
  );
};
