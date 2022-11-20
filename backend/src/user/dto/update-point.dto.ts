import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePointDto {
  @IsNumber()
  @IsNotEmpty()
  point: number;
}
