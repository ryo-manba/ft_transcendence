import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DifficultyLevel } from '../types/game';

export class PlayGameDto {
  @IsString()
  @IsNotEmpty()
  difficulty: DifficultyLevel;

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
