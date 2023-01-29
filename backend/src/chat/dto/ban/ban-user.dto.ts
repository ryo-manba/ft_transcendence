import { IsNotEmpty, IsNumber } from 'class-validator';

export class BanUserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
