import { IsNotEmpty, IsNumber } from 'class-validator';

export class AcceptInvitationDto {
  @IsNumber()
  @IsNotEmpty()
  guestId: number;

  @IsNumber()
  @IsNotEmpty()
  hostId: number;
}
