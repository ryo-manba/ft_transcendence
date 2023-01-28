import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetJoinedChatroomsDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
