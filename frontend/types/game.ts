import { User } from '@prisma/client';

const difficultyLevelArray: readonly string[] = [
  'Easy',
  'Normal',
  'Hard',
] as const;

export type DifficultyLevel = typeof difficultyLevelArray[number];

export const isDifficultyLevel = (value: unknown): value is DifficultyLevel => {
  return typeof value === 'string' && difficultyLevelArray.includes(value);
};

export type GameSetting = {
  difficulty: DifficultyLevel;
  matchPoint: number;
};

export type GameRecordWithUserName = {
  id: number;
  winnerScore: number;
  loserScore: number;
  createdAt: Date;
  loser: User;
  winner: User;
};

export type FinishedGameInfo = {
  winnerName: string;
  loserName: string;
  winnerScore: number;
  loserScore: number;
};
