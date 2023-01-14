import { IsNotEmpty, IsInt, IsString, MaxLength } from 'class-validator';

const maxMessageLength = 2000;

export class CreateMessageDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsInt()
  chatroomId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(maxMessageLength)
  message: string;
}
