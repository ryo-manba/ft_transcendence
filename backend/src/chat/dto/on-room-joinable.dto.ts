import { IsNotEmpty, IsNumber } from 'class-validator';

export class OnRoomJoinableDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
