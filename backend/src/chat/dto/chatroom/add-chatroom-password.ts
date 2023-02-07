import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddChatroomPasswordDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
