import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetInvitedListDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
