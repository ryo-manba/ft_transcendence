import { IsNotEmpty, IsInt, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsNotEmpty()
  @IsInt()
  chatroomId: number;

  @IsNotEmpty()
  @IsString()
  message: string;
}
