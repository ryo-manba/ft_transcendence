import { Socket, RemoteSocket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

type GameState = 'Setting' | 'Playing';

type DifficultyLevel = 'Easy' | 'Normal' | 'Hard';

export type Player = {
  name: string;
  id: number;
  point: number;
  socket: Socket | RemoteSocket<DefaultEventsMap, undefined>;
  height: number;
  score: number;
};

export type Ball = {
  x: number;
  y: number;
  radius: number;
};

export type BallVec = {
  xVec: number;
  yVec: number;
  speed: number;
};

export type GameSetting = {
  difficulty: DifficultyLevel;
  matchPoint: number;
  player1Score: number;
  player2Score: number;
};

export type RoomInfo = {
  roomName: string;
  player1: Player;
  player2: Player;
  supporters: Socket[];
  ball: Ball;
  ballVec: BallVec;
  isPlayer1Turn: boolean;
  gameSetting: GameSetting;
  barSpeed: number;
  rewards: number;
  gameState: GameState;
};

export type GameInfo = {
  height1: number;
  height2: number;
  ball: Ball;
};

export type FinishedGameInfo = {
  winnerName: string;
  loserName: string;
  winnerScore: number;
  loserScore: number;
};

export type Friend = {
  id: number;
  name: string;
};

export type Invitation = {
  guestId: number;
  hostId: number;
  hostSocketId: string;
};
