import { IsNotEmpty, IsNumber } from 'class-validator';

export class MuteUserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
