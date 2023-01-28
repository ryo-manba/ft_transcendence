import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';

const MAX_MESSAGE_LENGTH = 2000;

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
  @MaxLength(MAX_MESSAGE_LENGTH)
  message: string;
}
