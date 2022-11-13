import { Grid, Typography, Zoom } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayerNamesStore } from 'store/game/PlayerNames';
import { usePlayStateStore, PlayState } from 'store/game/PlayState';
import { GameHeader } from 'components/game/play/GameHeader';
import { GameSetting } from 'types/game';

type Props = {
  gameSetting: GameSetting;
};

type Ball = {
  x: number;
  y: number;
  radius: number;
};

type GameInfo = {
  height1: number;
  height2: number;
  ball: Ball;
};

type GameParameters = {
  canvasWidth: number;
  canvasHeight: number;
  barWidth: number;
  barLength: number;
  barSpeed: number;
  player1X: number;
  player2X: number;
  highestPos: number;
  lowestPos: number;
  sideBarLeft: number;
  sideBarRight: number;
  lineDashStyle: [number, number];
  initialHeight: number;
  ballInitialX: number;
  ballInitialY: number;
  ballRadius: number;
  widthRatio: number;
};

const convert2Int = (float: number) => float - (float % 1);

const getGameParameters = (canvasWidth: number) => {
  const gameParameters: GameParameters = {
    canvasWidth,
    canvasHeight: convert2Int(canvasWidth * 0.6),
    barWidth: convert2Int(canvasWidth * 0.02),
    barLength: 0,
    barSpeed: 0,
    player1X: convert2Int(canvasWidth * 0.02),
    player2X: convert2Int(canvasWidth * 0.96),
    highestPos: 0,
    lowestPos: 0,
    sideBarLeft: convert2Int(canvasWidth * 0.05),
    sideBarRight: convert2Int(canvasWidth * 0.95),
    lineDashStyle: [20, 5],
    initialHeight: 0,
    ballInitialX: convert2Int(canvasWidth / 2),
    ballInitialY: 0,
    ballRadius: convert2Int(canvasWidth * 0.01),
    widthRatio: 0,
  };
  gameParameters.barLength = convert2Int(gameParameters.canvasHeight / 6);
  gameParameters.barSpeed = convert2Int(gameParameters.barLength / 5);
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

export const Play = ({ gameSetting }: Props) => {
  // function to get window width
  const getWindowWidth = () => {
    const { innerWidth, innerHeight } = window;
    const widthFromHeight = convert2Int((innerHeight - 150) / 0.6);

    return innerWidth < widthFromHeight ? innerWidth : widthFromHeight;
  };

  const { socket } = useSocketStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playerNames } = usePlayerNamesStore();
  const [scores, updateScores] = useState<[number, number]>([0, 0]);
  const [gameParameters, setGameParameters] = useState(
    getGameParameters(getWindowWidth()),
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

  const drawField = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      gameInfo: GameInfo,
      params: GameParameters,
    ) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
      ctx.moveTo(params.canvasWidth / 2, params.highestPos);
      ctx.lineTo(params.canvasWidth / 2, params.lowestPos + params.barLength);
      ctx.stroke();

      // draw ball
      ctx.beginPath();
      ctx.moveTo(gameInfo.ball.x, gameInfo.ball.y);
      ctx.arc(
        gameInfo.ball.x,
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
    let move = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (key === 'ArrowDown') {
        ++move;
      } else if (key === 'ArrowUp') {
        --move;
      }
    };

    document.addEventListener('keydown', onKeyDown);

    const render = () => {
      drawField(context, gameInfo, gameParameters);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    socket?.on('updateGameInfo', (newGameInfo: GameInfo) => {
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

    const id = setInterval(() => {
      if (countDown === 0) {
        socket?.emit('barMove', move);
        move = 0;
      }
    }, 17);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      clearInterval(id);
      socket?.off('updateGameInfo');
    };
  }, [drawField, countDown, gameInfo, gameParameters]);

  useEffect(() => {
    socket?.on('updateScores', (newScores: [number, number]) => {
      updateScores(newScores);
    });

    return () => {
      socket?.off('updateScores');
    };
  }, [scores]);

  useEffect(() => {
    socket?.on('win', () => {
      updatePlayState(PlayState.stateWinner);
    });
    socket?.on('lose', () => {
      updatePlayState(PlayState.stateLoser);
    });
    socket?.on('error', () => {
      updatePlayState(PlayState.stateNothing);
    });

    return () => {
      socket?.off('win');
      socket?.off('lose');
      socket?.off('error');
    };
  }, [socket]);

  useEffect(() => {
    const handleWindowResize = () => {
      setGameParameters(getGameParameters(getWindowWidth()));
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

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

  return (
    <>
      {countDown !== 0 && (
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
        <GameHeader
          maxWidth={gameParameters.canvasWidth}
          left={playerNames[0]}
          center="VS"
          right={playerNames[1]}
        />
        <GameHeader
          maxWidth={gameParameters.canvasWidth}
          left={scores[0]}
          center=":"
          right={scores[1]}
        />
        <canvas
          ref={canvasRef}
          width={gameParameters.canvasWidth}
          height={gameParameters.canvasHeight}
        />
        <Typography
          align="center"
          maxWidth={gameParameters.canvasWidth}
        >{`Difficulty: ${gameSetting.difficulty} / Match Point: ${gameSetting.matchPoint}`}</Typography>
      </div>
    </>
  );
};
