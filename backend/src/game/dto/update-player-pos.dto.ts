import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePlayerPosDto {
  @IsNumber()
  @IsNotEmpty()
  move: number;
}
