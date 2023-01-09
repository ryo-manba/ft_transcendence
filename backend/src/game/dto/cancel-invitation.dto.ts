import { IsNotEmpty, IsNumber } from 'class-validator';

export class CancelInvitationDto {
  @IsNumber()
  @IsNotEmpty()
  guestId: number;

  @IsNumber()
  @IsNotEmpty()
  hostId: number;
}
