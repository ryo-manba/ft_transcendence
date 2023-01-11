import { IsNotEmpty, IsNumber } from 'class-validator';

export class InviteFriendDto {
  @IsNotEmpty()
  @IsNumber()
  guestId: number;

  @IsNotEmpty()
  @IsNumber()
  hostId: number;
}
