import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePointDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  point: number;
}
