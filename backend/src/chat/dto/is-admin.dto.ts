import { IsNotEmpty, IsNumber } from 'class-validator';

export class IsAdminDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
