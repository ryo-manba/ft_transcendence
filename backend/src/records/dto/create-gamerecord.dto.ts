import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateGameRecordDto {
  @IsNumber()
  @IsNotEmpty()
  winnerId: number;

  @IsNumber()
  @IsNotEmpty()
  loserId: number;

  @IsNumber()
  @IsNotEmpty()
  winnerScore: number;

  @IsNumber()
  @IsNotEmpty()
  loserScore: number;
}
