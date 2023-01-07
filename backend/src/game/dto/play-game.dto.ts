import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PlayGameDto {
  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @IsNumber()
  @IsNotEmpty()
  matchPoint: number;

  @IsNumber()
  @IsNotEmpty()
  player1Score: number;

  @IsNumber()
  @IsNotEmpty()
  player2Score: number;
}
