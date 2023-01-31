import { IsNotEmpty, IsNumber } from 'class-validator';

export class UnmuteUserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
