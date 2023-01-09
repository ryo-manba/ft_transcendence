import { IsNotEmpty, IsNumber } from 'class-validator';

export class DenyInvitationDto {
  @IsNumber()
  @IsNotEmpty()
  guestId: number;

  @IsNumber()
  @IsNotEmpty()
  hostId: number;
}
