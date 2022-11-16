import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserEloDto {
  @IsNumber()
  @IsNotEmpty()
  elo: number;
}
