import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class updatePasswordDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
