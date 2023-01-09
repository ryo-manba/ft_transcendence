import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetMessagesCountDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
