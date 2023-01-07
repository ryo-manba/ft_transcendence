import { IsNotEmpty, IsString } from 'class-validator';

export class WatchGameDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;
}
