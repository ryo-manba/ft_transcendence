import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UpdateChatroomPasswordDto {
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
