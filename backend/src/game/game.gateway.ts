import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { RecordsService } from '../records/records.service';
import { UserService } from '../user/user.service';

type Player = {
  name: string;
  id: number;
  point: number;
  socket: Socket;
  height: number;
  score: number;
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
  matchPoint: number;
  barSpeed: number;
  rewards: number;
};

type GameInfo = {
  height1: number;
  height2: number;
  ball: Ball;
};

type DifficultyLevel = 'Easy' | 'Normal' | 'Hard';

type GameSetting = {
  difficulty: DifficultyLevel;
  matchPoint: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/game',
})
export class GameGateway {
  constructor(
    private readonly records: RecordsService,
    private readonly user: UserService,
  ) {}

  roomNum = 0;
  gameRooms: RoomInfo[] = [];
  waitingQueue: Player[] = [];

  // Game parameters
  static initialHeight = 250;
  static ballInitialX = 500;
  static ballInitialY = 300;
  static ballRadius = 10;
  static ballInitialXVec = -1;
  static ballSpeed = 3;
  static highestPos = 10; // top left corner of the canvas is (0, 0)
  static lowestPos = 490;
  static leftEnd = 40;
  static rightEnd = 960;
  static barLength = 100;
  static matchPoint = 3;
  static boardWidth = 1000;
  static barSpeed = 30;

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('GameGateway');

  handleConnection(socket: Socket) {
    this.logger.log(`Connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Disconnected: ${socket.id}`);

    this.gameRooms = this.gameRooms.filter(
      (room) =>
        room.player1.socket.id !== socket.id &&
        room.player2.socket.id !== socket.id,
    );
    this.waitingQueue = this.waitingQueue.filter(
      (player) => player.socket.id !== socket.id,
    );
  }

  setBallYVec() {
    return Math.random() * (Math.random() < 0.5 ? 1 : -1);
  }

  updatePlayerStatus(player1: Player, player2: Player) {
    const playerNames: [string, string] = [player1.name, player2.name];

    // if both players' points are equal, first player joining the que will select the rule
    if (player1.point <= player2.point) {
      player1.socket.emit('select', playerNames);
      player2.socket.emit('standBy', playerNames);
    } else {
      player1.socket.emit('standBy', playerNames);
      player2.socket.emit('select', playerNames);
    }
  }

  @SubscribeMessage('playStart')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: number,
  ) {
    if (this.waitingQueue.length == 0) {
      await this.user
        .findOne(data)
        .then((user) => {
          this.waitingQueue.push({
            name: user.name,
            id: data,
            point: user.point,
            socket: socket,
            height: GameGateway.initialHeight,
            score: 0,
          });
        })
        .catch((error) => {
          this.logger.log(error);
        });
    } else {
      const player1 = this.waitingQueue.pop();
      let player2: Player;
      await this.user
        .findOne(data)
        .then((user) => {
          player2 = {
            name: user.name,
            id: data,
            point: user.point,
            socket: socket,
            height: GameGateway.initialHeight,
            score: 0,
          };
        })
        .catch((error) => {
          this.logger.log(error);
        });
      const roomName = String(this.roomNum);
      this.roomNum++;

      this.logger.log(`${player1.socket.id} joined to room ${roomName}`);
      this.logger.log(`${player2.socket.id} joined to room ${roomName}`);

      await player1.socket.join(roomName);
      await player2.socket.join(roomName);

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
        matchPoint: GameGateway.matchPoint,
        barSpeed: GameGateway.barSpeed,
        rewards: 0,
      };

      this.gameRooms.push(newRoom);

      this.updatePlayerStatus(player1, player2);
    }
  }

  @SubscribeMessage('completeSetting')
  playGame(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: GameSetting,
  ) {
    const room = this.gameRooms.find(
      (r) =>
        r.player1.socket.id === socket.id || r.player2.socket.id === socket.id,
    );
    if (!room) {
      socket.emit('error');
    } else {
      room.matchPoint = data.matchPoint;
      room.rewards = 10 * room.matchPoint;
      switch (data.difficulty) {
        case 'Normal':
          room.barSpeed = 40;
          room.ballVec.speed = 4;
          break;
        case 'Hard':
          room.barSpeed = 50;
          room.ballVec.speed = 5;
          room.rewards *= 2;
          break;
        default:
          room.rewards *= 0.5;
          break;
      }
      this.server.to(room.roomName).emit('playStarted', data);
    }
  }

  async finishGame(currentRoom: RoomInfo, winner: Player, loser: Player) {
    winner.socket.emit('win');
    loser.socket.emit('lose');
    await this.records.createGameRecord({
      winnerId: winner.id,
      loserId: loser.id,
      winnerScore: winner.score,
      loserScore: loser.score,
    });
    await this.user.updateUserPoint(winner.id, { point: currentRoom.rewards });
    await this.user.updateUserPoint(loser.id, { point: -currentRoom.rewards });
    winner.socket.disconnect(true);
    loser.socket.disconnect(true);
    this.gameRooms = this.gameRooms.filter(
      (room) => room.roomName !== currentRoom.roomName,
    );
  }

  @SubscribeMessage('playCancel')
  cancelMatching(@ConnectedSocket() socket: Socket) {
    this.waitingQueue = this.waitingQueue.filter(
      (player) => player.socket.id !== socket.id,
    );
  }

  @SubscribeMessage('barMove')
  async updatePlayerPos(
    @ConnectedSocket() socket: Socket,
    @MessageBody() move: number,
  ) {
    let isGameOver = false;

    // Identify a corresponding room, player, ball, and ballVec based on socket
    const room = this.gameRooms.find(
      (r) =>
        r.player1.socket.id === socket.id || r.player2.socket.id === socket.id,
    );
    if (!room) {
      socket.emit('error');

      return;
    }
    const player =
      room.player1.socket.id === socket.id ? room.player1 : room.player2;
    const ball = room.ball;
    const ballVec = room.ballVec;

    // Update player position using information received
    const updatedHeight = player.height + move * room.barSpeed;
    if (updatedHeight < GameGateway.highestPos) {
      player.height = GameGateway.highestPos;
    } else if (GameGateway.lowestPos < updatedHeight) {
      player.height = GameGateway.lowestPos;
    } else {
      player.height = updatedHeight;
    }

    // Update yVec of ball when bouncing on side bars
    if (
      (ballVec.yVec < 0 && ball.y < GameGateway.highestPos) ||
      (0 < ballVec.yVec &&
        GameGateway.lowestPos + GameGateway.barLength < ball.y)
    ) {
      ballVec.yVec *= -1;
    }

    // Update xVec of ball
    if (ball.x < GameGateway.leftEnd) {
      if (
        ballVec.xVec < 0 &&
        room.player1.height <= ball.y &&
        ball.y <= room.player1.height + GameGateway.barLength
      ) {
        ballVec.xVec = 1;
        ballVec.yVec =
          ((ball.y - (room.player1.height + GameGateway.barLength / 2)) * 2) /
          GameGateway.barLength;
      } else {
        isGameOver = true;
        room.player2.score++;
      }
    } else if (GameGateway.rightEnd < ball.x) {
      if (
        0 < ballVec.xVec &&
        room.player2.height <= ball.y &&
        ball.y <= room.player2.height + GameGateway.barLength
      ) {
        ballVec.xVec = -1;
        ballVec.yVec =
          ((ball.y - (room.player2.height + GameGateway.barLength / 2)) * 2) /
          GameGateway.barLength;
      } else {
        isGameOver = true;
        room.player1.score++;
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
      if (room.matchPoint === room.player1.score) {
        await this.finishGame(room, room.player1, room.player2);
      } else if (room.matchPoint === room.player2.score) {
        await this.finishGame(room, room.player2, room.player1);
      } else {
        this.server
          .to(room.roomName)
          .emit('updateScores', [room.player1.score, room.player2.score]);
      }
    }
    this.sendGameInfo();
  }

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
