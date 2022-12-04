import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFriendDto {
  @IsNumber()
  @IsNotEmpty()
  followerId: number;

  @IsNumber()
  @IsNotEmpty()
  followingId: number;
}
