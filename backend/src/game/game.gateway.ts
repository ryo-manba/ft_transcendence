import {
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Interval } from '@nestjs/schedule';

type Player = {
  name: string;
  socket: Socket;
  height: number;
};

type Ball = {
  x: number;
  y: number;
  radius: number;
};

type BallVec = {
  xVec: number;
  yVec: number;
  speed: number;
};

type RoomInfo = {
  roomName: string;
  player1: Player;
  player2: Player;
  ball: Ball;
  ballVec: BallVec;
  isPlayer1Turn: boolean;
};

// type GameInfo = {
//   player1: Player;
//   player2: Player;
//   ball: Ball;
// };
type GameInfo = {
  height1: number;
  height2: number;
  ball: Ball;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/game',
})
export class GameGateway {
  roomNum = 0;
  gameRooms: RoomInfo[] = [];
  waitingQueue: Player[] = [];

  // Game parameters
  static initialHeight = 220;
  static ballInitialX = 500;
  static ballInitialY = 300;
  static ballRadius = 10;
  static ballInitialXVec = -1;
  static ballSpeed = 1.5;
  static highestPos = 10; // top left corner of the canvas is (0, 0)
  static lowestPos = 490;
  static leftEnd = 40;
  static rightEnd = 960;
  static barLength = 100;

  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    console.log('hello', socket.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('bye', socket.id);

    this.gameRooms = this.gameRooms.filter(
      (room) =>
        room.player1.socket.id !== socket.id &&
        room.player2.socket.id !== socket.id,
    );
    this.waitingQueue = this.waitingQueue.filter(
      (n) => n.socket.id !== socket.id,
    );
  }

  setBallYVec() {
    return Math.random() * (Math.random() < 0.5 ? 1 : -1);
  }

  @SubscribeMessage('playStart')
  joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: string) {
    if (this.waitingQueue.length == 0) {
      this.waitingQueue.push({
        name: data,
        socket: socket,
        height: GameGateway.initialHeight,
      });
    } else {
      const player1 = this.waitingQueue.pop();
      const player2 = {
        name: data,
        socket: socket,
        height: GameGateway.initialHeight,
      };
      console.log(player1, player2);
      const roomName = String(this.roomNum);
      this.roomNum++;

      console.log(player1.socket.id, 'joined to room', roomName);
      console.log(player2.socket.id, 'joined to room', roomName);

      void player1.socket.join(roomName);
      void player2.socket.join(roomName);

      const ball: Ball = {
        x: GameGateway.ballInitialX,
        y: GameGateway.ballInitialY,
        radius: GameGateway.ballRadius,
      };

      const ballVec: BallVec = {
        xVec: GameGateway.ballInitialXVec,
        yVec: this.setBallYVec(),
        speed: GameGateway.ballSpeed,
      };

      const newRoom: RoomInfo = {
        roomName: roomName,
        player1: player1,
        player2: player2,
        ball: ball,
        ballVec: ballVec,
        isPlayer1Turn: true,
      };
      this.gameRooms.push(newRoom);

      this.server.to(roomName).emit('playStarted');
    }
  }

  @SubscribeMessage('barMove')
  updatePlayerPos(
    @ConnectedSocket() socket: Socket,
    @MessageBody() move: number,
  ) {
    let isGameOver = false;

    // Identify a corresponding room, player, ball, and ballVec based on socket
    const room = this.gameRooms.find(
      (r) =>
        r.player1.socket.id === socket.id || r.player2.socket.id === socket.id,
    );
    const player =
      room.player1.socket.id === socket.id ? room.player1 : room.player2;
    const ball = room.ball;
    const ballVec = room.ballVec;

    // Update player position using information received
    const updatedHeight = player.height + move;
    if (updatedHeight < GameGateway.highestPos) {
      player.height = GameGateway.highestPos;
    } else if (GameGateway.lowestPos < updatedHeight) {
      player.height = GameGateway.lowestPos;
    } else {
      player.height = updatedHeight;
    }

    // Update yVec of ball
    if (
      (ballVec.yVec < 0 && ball.y < GameGateway.highestPos) ||
      (0 < ballVec.yVec &&
        GameGateway.lowestPos + GameGateway.barLength < ball.y)
    ) {
      ballVec.yVec *= -1;
    }

    // Update xVec of ball
    if (ball.x < GameGateway.leftEnd || GameGateway.rightEnd < ball.x) {
      if (
        ballVec.xVec < 0 &&
        room.player1.height <= ball.y &&
        ball.y <= room.player1.height + GameGateway.barLength
      ) {
        ballVec.xVec = 1;
      } else if (
        0 < ballVec.xVec &&
        room.player2.height <= ball.y &&
        ball.y <= room.player2.height + GameGateway.barLength
      ) {
        ballVec.xVec = -1;
      } else {
        isGameOver = true;
      }
    }

    // Update ball position
    if (!isGameOver) {
      ball.x += ballVec.xVec * ballVec.speed;
      ball.y += ballVec.yVec * ballVec.speed;
    } else {
      ball.x = GameGateway.ballInitialX;
      ball.y = GameGateway.ballInitialY;
      ballVec.xVec = room.isPlayer1Turn ? 1 : -1;
      ballVec.yVec = this.setBallYVec();
      room.isPlayer1Turn = !room.isPlayer1Turn;
    }
    const gameInfo: GameInfo = {
      height1: room.player1.height,
      height2: room.player2.height,
      ball: room.ball,
    };
    this.server.to(room.roomName).emit('updateGameInfo', gameInfo);
  }

  @Interval(33)
  sendGameInfo() {
    for (const room of this.gameRooms) {
      const gameInfo: GameInfo = {
        height1: room.player1.height,
        height2: room.player2.height,
        ball: room.ball,
      };
      this.server.to(room.roomName).emit('updateGameInfo', gameInfo);
    }
  }

  @SubscribeMessage('watchList')
  getGameRooms(@ConnectedSocket() socket: Socket) {
    // exclude duplications
    type WatchInfo = {
      roomName: string;
      name1: string;
      name2: string;
    };

    const watchInfo: WatchInfo[] = this.gameRooms.map(
      (room) =>
        <WatchInfo>{
          roomName: room.roomName,
          name1: room.player1.name,
          name2: room.player2.name,
        },
    );
    socket.emit('watchListed', watchInfo);
  }
}
