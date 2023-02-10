import { IsNotEmpty, IsNumber } from 'class-validator';

export class WatchFriendGameDto {
  @IsNumber()
  @IsNotEmpty()
  friendId: number;
}
