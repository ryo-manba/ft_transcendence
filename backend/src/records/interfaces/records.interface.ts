import { User } from '@prisma/client';

export interface GameRecordWithUserName {
  id: number;
  winnerScore: number;
  loserScore: number;
  createdAt: Date;
  loser: User;
  winner: User;
}
