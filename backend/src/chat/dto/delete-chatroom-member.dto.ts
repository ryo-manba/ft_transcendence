import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteChatroomMemberDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
