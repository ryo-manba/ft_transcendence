import { Grid, Typography, Zoom } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from 'store/game/ClientSocket';
import { usePlayerNamesStore } from 'store/game/PlayerName';
import {
  usePlayStateStore,
  stateWinner,
  stateLoser,
} from 'store/game/PlayState';

// Question: Where should we define types that are used both in frontend and
// backend while they are not used in the databases (therefore not defined or
// managed by prisma)?

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

export const Play = () => {
  const { socket } = useSocketStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playerNames } = usePlayerNamesStore();
  const [scores, updateScores] = useState<[number, number]>([0, 0]);
  const updatePlayState = usePlayStateStore((store) => store.updatePlayState);
  const [countDown, updateCountDown] = useState(3);
  const [changeCount, updateChangeCount] = useState(true);

  // Game parameters
  const barWidth = 20;
  const barLength = 100;
  const barSpeed = 20;
  const player1X = 20;
  const player2X = 960;
  const canvasWidth = '1000';
  const canvasHeight = '600';
  const highestPos = 10;
  const lowestPos = 490;
  const sideBarLeft = 50;
  const sideBarRight = 950;
  const lineDashStyle = [20, 5];
  const initialHeight = 220;
  const ballInitialX = 500;
  const ballInitialY = 300;
  const ballRadius = 10;

  const drawField = useCallback(
    (ctx: CanvasRenderingContext2D, y1: number, y2: number, ballInfo: Ball) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillRect(player1X, y1, barWidth, barLength);
      ctx.fillRect(player2X, y2, barWidth, barLength);

      // draw upper side line
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(sideBarLeft, highestPos);
      ctx.lineTo(sideBarRight, highestPos);

      // draw bottom side line
      ctx.moveTo(sideBarLeft, lowestPos + barLength);
      ctx.lineTo(sideBarRight, lowestPos + barLength);
      ctx.stroke();

      // draw center line
      ctx.beginPath();
      ctx.setLineDash(lineDashStyle);
      ctx.moveTo(+canvasWidth / 2, highestPos);
      ctx.lineTo(+canvasWidth / 2, lowestPos + barLength);
      ctx.stroke();

      // draw ball
      ctx.beginPath();
      ctx.moveTo(ballInfo.x, ballInfo.y);
      ctx.arc(ballInfo.x, ballInfo.y, ballInfo.radius, 0, Math.PI * 2);
      ctx.fill();
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    let animationFrameId: number;
    let y1 = initialHeight;
    let y2 = initialHeight;
    let move = 0;
    let ball: Ball = {
      x: ballInitialX,
      y: ballInitialY,
      radius: ballRadius,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (key === 'ArrowDown') {
        move += barSpeed;
      } else if (key === 'ArrowUp') {
        move -= barSpeed;
      }
      console.log(move);
    };

    // TODO: prioritize bar move than screen move when the screen height is
    // smaller than the canvas height
    document.addEventListener('keydown', onKeyDown);

    const render = () => {
      drawField(context, y1, y2, ball);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    socket?.on('updateGameInfo', (gameInfo: GameInfo) => {
      y1 = gameInfo.height1;
      y2 = gameInfo.height2;
      ball = gameInfo.ball;
    });

    const id = setInterval(() => {
      if (countDown === 0) {
        socket?.emit('barMove', move);
        move = 0;
      }
    }, 33);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      clearInterval(id);
      socket?.off('updateGameInfo');
    };
  }, [drawField, countDown]);

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
      updatePlayState(stateWinner);
    });
    socket?.on('lose', () => {
      updatePlayState(stateLoser);
    });

    return () => {
      socket?.off('win');
      socket?.off('lose');
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
        <Grid container>
          <Grid
            container
            item
            xs={5}
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <h2>{playerNames[0]}</h2>
          </Grid>
          <Grid
            container
            item
            xs={2}
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <h2>VS</h2>
          </Grid>
          <Grid
            container
            item
            xs={5}
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <h2>{playerNames[1]}</h2>
          </Grid>
          <Grid
            container
            item
            xs={5}
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <h2>{scores[0]}</h2>
          </Grid>
          <Grid
            container
            item
            xs={2}
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <h2>:</h2>
          </Grid>
          <Grid
            container
            item
            xs={5}
            direction="row"
            alignItems="center"
            justifyContent="center"
          >
            <h2>{scores[1]}</h2>
          </Grid>
        </Grid>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
      </div>
    </>
  );
};
