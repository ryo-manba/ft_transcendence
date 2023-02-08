import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class DeleteChatroomPasswordDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsString()
  @IsNotEmpty()
  oldPassword: string;
}
