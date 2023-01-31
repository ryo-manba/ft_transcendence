import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetJoinableChatRoomsDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
