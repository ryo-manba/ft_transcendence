import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateAdminDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
