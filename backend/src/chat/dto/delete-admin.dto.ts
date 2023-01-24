import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteAdminDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
