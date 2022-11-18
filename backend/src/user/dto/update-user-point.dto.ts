import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserPointDto {
  @IsNumber()
  @IsNotEmpty()
  point: number;
}
