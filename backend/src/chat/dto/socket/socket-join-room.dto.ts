import { IsNotEmpty, IsInt } from 'class-validator';

export class SocketJoinRoomDto {
  @IsNotEmpty()
  @IsInt()
  roomId: number;
}
