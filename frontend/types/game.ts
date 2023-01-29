export const DifficultyLevel = {
  EASY: 'Easy',
  NORMAL: 'Normal',
  HARD: 'Hard',
} as const;

export type DifficultyLevel =
  typeof DifficultyLevel[keyof typeof DifficultyLevel];

export const UserStatus = {
  ONLINE: 'ONLINE',
  PLAYING: 'PLAYING',
  OFFLINE: 'OFFLINE',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export type GameSetting = {
  difficulty: DifficultyLevel;
  matchPoint: number;
  player1Score: number;
  player2Score: number;
};

export type GameRecordWithUserName = {
  id: number;
  winnerScore: number;
  loserScore: number;
  createdAt: Date;
  loserName: string;
  winnerName: string;
};

export type FinishedGameInfo = {
  winnerName: string;
  loserName: string;
  winnerScore: number;
  loserScore: number;
};

export type Invitation = {
  hostId: number;
  guestId: number;
};

export type Ball = {
  x: number;
  y: number;
  radius: number;
};

export type GameInfo = {
  height1: number;
  height2: number;
  ball: Ball;
};

export type GameParameters = {
  topLeftX: number;
  canvasWidth: number;
  canvasHeight: number;
  barWidth: number;
  barLength: number;
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

export type SocketAuth = {
  userId: number;
};
