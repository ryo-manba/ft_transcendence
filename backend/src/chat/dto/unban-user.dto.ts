import { IsNotEmpty, IsNumber } from 'class-validator';

export class UnbanUserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
