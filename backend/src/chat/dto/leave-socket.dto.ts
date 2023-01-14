import { IsNotEmpty, IsNumber } from 'class-validator';

export class LeaveSocketDto {
  @IsNumber()
  @IsNotEmpty()
  roomId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
