import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetMessagesDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsNumber()
  @IsNotEmpty()
  skip: number;
}
