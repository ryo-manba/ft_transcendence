export interface GameRecordWithUserName {
  id: number;
  winnerScore: number;
  loserScore: number;
  createdAt: Date;
  loserName: string;
  winnerName: string;
}
