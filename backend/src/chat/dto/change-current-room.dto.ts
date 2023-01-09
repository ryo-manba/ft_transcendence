import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChangeCurrentRoomDto {
  @IsNumber()
  @IsNotEmpty()
  roomId: number;
}
