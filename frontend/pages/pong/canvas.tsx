import React, { useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface BallInfo {
  x: number;
  y: number;
  radius: number;
}

interface Player {
  height: number;
}

interface GameInfo {
  players: Player[];
  ballInfo: BallInfo;
}

interface ServerToClientEvents {
  updateGameInfo: (gameInfo: GameInfo) => void;
}

interface ClientToServerEvents {
  barMove: (move: number) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  'http://localhost:8080',
);

type CanvasProps = {
  width: string;
  height: string;
};

const Canvas = (props: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barWidth = 20;
  const barHeight = 100;
  const speed = 20;

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      y1: number,
      y2: number,
      ballInfo: BallInfo,
    ) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillRect(20, y1, barWidth, barHeight);
      ctx.fillRect(960, y2, barWidth, barHeight);

      // draw upper side line
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(50, 10);
      ctx.lineTo(950, 10);

      // draw bottom side line
      ctx.moveTo(50, 590);
      ctx.lineTo(950, 590);
      ctx.stroke();

      // draw center line
      ctx.beginPath();
      ctx.setLineDash([20, 5]);
      ctx.moveTo(500, 10);
      ctx.lineTo(500, 590);
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
    let y1 = 220;
    let y2 = 220;
    let move = 0;
    let ballInfo: BallInfo = {
      x: 500,
      y: 300,
      radius: 10,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (key === 'ArrowDown') {
        move += speed;
      } else if (key === 'ArrowUp') {
        move -= speed;
      }
      console.log(move);
    };

    // TODO: prioritize bar move than screen move when the screen height is
    // smaller than the canvas height
    document.addEventListener('keydown', onKeyDown);

    const render = () => {
      draw(context, y1, y2, ballInfo);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    socket.on('updateGameInfo', (gameInfo: GameInfo) => {
      y1 = gameInfo.players[0].height;
      y2 = gameInfo.players[1].height;
      ballInfo = gameInfo.ballInfo;
    });

    setInterval(() => {
      socket.emit('barMove', move);
      move = 0;
    }, 33);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  return <canvas ref={canvasRef} width={props.width} height={props.height} />;
};

export default Canvas;
