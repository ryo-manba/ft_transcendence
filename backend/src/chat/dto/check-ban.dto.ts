import { IsNotEmpty, IsNumber } from 'class-validator';

export class CheckBanDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
