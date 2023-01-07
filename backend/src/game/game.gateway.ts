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
import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  Ball,
  BallVec,
  GameSetting,
  RoomInfo,
  GameInfo,
  FinishedGameInfo,
  Friend,
  Invitation,
} from './types/game';
import { GetInvitedListDto } from './dto/get-invited-list.dto';
import { InviteFriendDto } from './dto/invite-friend.dto';
import { CancelInvitationDto } from './dto/cancel-invitation.dto';
import { DenyInvitationDto } from './dto/deny-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { WatchGameDto } from './dto/watch-game.dto';

// host側は同時に複数招待を送ることはできない
class InvitationList {
  items: Invitation[] = [];
  insert = (newItem: Invitation): boolean => {
    const found = this.items.find((item) => item.hostId === newItem.hostId);

    if (found === undefined) {
      this.items.push(newItem);

      return true;
    }

    return false;
  };

  // 消去する要素があればtrueを返す
  delete = (hostId: number): boolean => {
    const oldLen = this.items.length;
    this.items = this.items.filter((item) => item.hostId !== hostId);

    return oldLen !== this.items.length;
  };

  find = (hostId: number): Invitation => {
    const found = this.items.find((item) => item.hostId === hostId);

    return found;
  };

  findHosts = (guestId: number): number[] => {
    const found = this.items.filter((item) => item.guestId === guestId);
    if (found === undefined) return undefined;

    return found.map((item) => item.hostId);
  };
}

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

  gameRooms: RoomInfo[] = [];
  waitingQueue: Player[] = [];
  invitationList: InvitationList = new InvitationList();
  userSocketMap: Map<number, Set<string>> = new Map();

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
  static defaultSetting: GameSetting = {
    difficulty: 'Easy',
    matchPoint: 3,
    player1Score: 0,
    player2Score: 0,
  };

  static boardWidth = 1000;
  static barSpeed = 10;

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('GameGateway');

  handleConnection(socket: Socket) {
    this.logger.log(`Connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Disconnected: ${socket.id}`);

    const id = (socket.handshake.auth as { id: number }).id;

    // ゲーム招待をしていた場合キャンセル
    const invitation = this.invitationList.find(id);
    if (invitation !== undefined) {
      const guestSocketIds = this.userSocketMap.get(invitation.guestId);
      if (guestSocketIds !== undefined) {
        guestSocketIds.forEach((socketId) => {
          this.server.to(socketId).emit('cancelInvitation', invitation.hostId);
        });
      }
      this.invitationList.delete(id);
    }

    // userIdとsocketIdをのつながりを消す
    const socketIds = this.userSocketMap.get(id);
    if (socketIds !== undefined) socketIds.delete(socket.id);

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

  /**
   * 接続と招待者の通知
   * @param socket
   * @param data
   * @returns Friend[]
   */
  @SubscribeMessage('getInvitedLlist')
  async getInvitedList(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: GetInvitedListDto,
  ): Promise<Friend[]> {
    // userIdとsocketIdをつなげる
    const socketIds = this.userSocketMap.get(dto.userId);
    if (socketIds === undefined)
      this.userSocketMap.set(dto.userId, new Set([socket.id]));
    else socketIds.add(socket.id);

    // 招待を送ったhostの一覧を返す
    const hostIds = this.invitationList.findHosts(dto.userId);
    if (hostIds === undefined) return [];
    else {
      const hosts = await this.user.findAll({
        where: {
          id: {
            in: Array.from(hostIds),
          },
        },
      });

      return hosts.map((item) => {
        return { name: item.name, id: item.id } as Friend;
      });
    }
  }

  /**
   * 招待を送る
   * @param data
   * @returns res
   */
  @SubscribeMessage('inviteFriend')
  async inviteFriend(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InviteFriendDto,
  ): Promise<boolean> {
    const newInvitation: Invitation = {
      guestId: dto.guestId,
      hostId: dto.hostId,
      hostSocketId: socket.id,
    };
    const res = this.invitationList.insert(newInvitation);

    if (res) {
      const host = await this.user.findOne(dto.hostId);

      const guestSocketIds = this.userSocketMap.get(dto.guestId);
      if (guestSocketIds !== undefined) {
        guestSocketIds.forEach((socketId) => {
          this.server.to(socketId).emit('inviteFriend', {
            name: host.name,
            id: host.id,
          } as Friend);
        });
      }
    }

    return res;
  }

  /**
   * host側が招待をキャンセルする
   * @param data
   */
  @SubscribeMessage('cancelInvitation')
  cancelInvitation(@MessageBody() dto: CancelInvitationDto) {
    const res = this.invitationList.delete(dto.hostId);

    // guest側にキャンセルを伝える
    if (res) {
      const guestSocketIds = this.userSocketMap.get(dto.guestId);
      if (guestSocketIds !== undefined) {
        guestSocketIds.forEach((socketId) => {
          this.server.to(socketId).emit('cancelInvitation', dto.hostId);
        });
      }
    }
  }

  @SubscribeMessage('denyInvitation')
  denyInvitation(@MessageBody() dto: DenyInvitationDto) {
    const invitation = this.invitationList.find(dto.hostId);
    if (invitation === undefined) return;

    this.invitationList.delete(invitation.hostId);
    this.server.to(invitation.hostSocketId).emit('denyInvitation');
  }

  /**
   * guestが招待を受け入れる
   * @param socket
   * @param data
   */
  @SubscribeMessage('acceptInvitation')
  async beginFriendMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: AcceptInvitationDto,
  ) {
    const invitation = this.invitationList.find(dto.hostId);
    if (invitation === undefined) return;

    this.invitationList.delete(invitation.hostId);

    const hostSockets = await this.server
      .in(invitation.hostSocketId)
      .fetchSockets();
    if (hostSockets.length === 0) return;

    // ゲームを行うタブ以外には招待キャンセルする。
    const guestSocketIds = this.userSocketMap.get(dto.guestId);
    if (guestSocketIds !== undefined) {
      guestSocketIds.forEach((socketId) => {
        if (socketId !== socket.id)
          this.server.to(socketId).emit('cancelInvitation', dto.hostId);
      });
    }

    const user1 = await this.user.findOne(dto.hostId);
    const player1: Player = {
      name: user1.name,
      id: user1.id,
      point: user1.point,
      socket: hostSockets[0],
      height: GameGateway.initialHeight,
      score: 0,
    };
    const user2 = await this.user.findOne(dto.guestId);
    const player2: Player = {
      name: user2.name,
      id: user2.id,
      point: user2.point,
      socket: socket,
      height: GameGateway.initialHeight,
      score: 0,
    };

    void this.startGame(player1, player2);
  }

  @SubscribeMessage('playStart')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    const waitingUserIdx = this.waitingQueue.findIndex(
      (item) => item.id !== dto.userId,
    );
    if (waitingUserIdx === -1) {
      const user = await this.user.findOne(dto.userId);
      if (user === null) return;
      this.waitingQueue.push({
        name: user.name,
        id: dto.userId,
        point: user.point,
        socket: socket,
        height: GameGateway.initialHeight,
        score: 0,
      });
    } else {
      const user = await this.user.findOne(dto.userId);
      if (user === null) return;

      const player1 = this.waitingQueue.splice(waitingUserIdx, 1)[0];
      const player2 = {
        name: user.name,
        id: dto.userId,
        point: user.point,
        socket: socket,
        height: GameGateway.initialHeight,
        score: 0,
      };
      void this.startGame(player1, player2);
    }
  }

  async startGame(player1: Player, player2: Player) {
    const roomName = uuidv4();

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
      supporters: [],
      ball: ball,
      ballVec: ballVec,
      isPlayer1Turn: true,
      gameSetting: GameGateway.defaultSetting,
      barSpeed: GameGateway.barSpeed,
      rewards: 0,
      gameState: 'Setting',
    };

    this.gameRooms.push(newRoom);

    this.updatePlayerStatus(player1, player2);
  }

  @SubscribeMessage('watchGame')
  async watchGame(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: WatchGameDto,
  ) {
    const room = this.gameRooms.find((r) => r.roomName === dto.roomName);
    if (!room) {
      socket.emit('error');

      return;
    }
    room.supporters.push(socket);
    this.logger.log(`${socket.id} joined to room ${dto.roomName}`);
    await socket.join(dto.roomName);
    const gameSetting = room.gameState === 'Setting' ? null : room.gameSetting;
    socket.emit('joinGameRoom', room.gameState, gameSetting);
  }

  @SubscribeMessage('cancelOngoingBattle')
  cancelGame(@ConnectedSocket() socket: Socket) {
    const room = this.gameRooms.find(
      (r) =>
        r.player1.socket.id === socket.id || r.player2.socket.id === socket.id,
    );
    if (!room) {
      socket.emit('error');
    } else {
      this.server.to(room.roomName).emit('cancelOngoingBattle');
      this.gameRooms = this.gameRooms.filter(
        (room) =>
          room.player1.socket.id !== socket.id &&
          room.player2.socket.id !== socket.id,
      );
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
      this.logger.log('completeSetting: ', data);
      room.gameSetting = data;
      room.rewards = 10 * data.matchPoint;
      switch (data.difficulty) {
        case 'Normal':
          room.barSpeed = 20;
          room.ballVec.speed = 5;
          break;
        case 'Hard':
          room.barSpeed = 30;
          room.ballVec.speed = 7;
          room.rewards *= 2;
          break;
        default:
          room.rewards *= 0.5;
          break;
      }
      room.gameState = 'Playing';
      this.server.to(room.roomName).emit('playStarted', data);
    }
  }

  async finishGame(currentRoom: RoomInfo, winner: Player, loser: Player) {
    const finishedGameInfo: FinishedGameInfo = {
      winnerName: winner.name,
      loserName: loser.name,
      winnerScore: winner.score,
      loserScore: loser.score,
    };
    currentRoom.supporters.map((supporter) => {
      supporter.emit('finishGame', null, finishedGameInfo);
      supporter.disconnect(true);
    });
    winner.socket.emit(
      'finishGame',
      winner.point + currentRoom.rewards,
      finishedGameInfo,
    );
    loser.socket.emit(
      'finishGame',
      Math.max(loser.point - currentRoom.rewards, 0),
      finishedGameInfo,
    );
    winner.socket.disconnect(true);
    loser.socket.disconnect(true);
    await this.records.createGameRecord({
      winnerId: winner.id,
      loserId: loser.id,
      winnerScore: winner.score,
      loserScore: loser.score,
    });
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
        r.player1.socket.id === socket.id ||
        r.player2.socket.id === socket.id ||
        r.supporters.find((s) => s.id === socket.id) !== undefined,
    );
    if (!room) {
      socket.emit('error');

      return;
    }
    if (
      room.player1.socket.id !== socket.id &&
      room.player2.socket.id !== socket.id
    ) {
      this.sendGameInfo(room);

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
      if (room.gameSetting.matchPoint === room.player1.score) {
        await this.finishGame(room, room.player1, room.player2);
      } else if (room.gameSetting.matchPoint === room.player2.score) {
        await this.finishGame(room, room.player2, room.player1);
      } else {
        this.server
          .to(room.roomName)
          .emit('updateScores', [room.player1.score, room.player2.score]);
        room.gameSetting.player1Score = room.player1.score;
        room.gameSetting.player2Score = room.player2.score;
      }
    }
    this.sendGameInfo(room);
  }

  sendGameInfo(room: RoomInfo) {
    const gameInfo: GameInfo = {
      height1: room.player1.height,
      height2: room.player2.height,
      ball: room.ball,
    };
    this.server.to(room.roomName).emit('updateGameInfo', gameInfo);
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
