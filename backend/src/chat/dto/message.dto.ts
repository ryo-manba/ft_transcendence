import { IsNotEmpty, IsInt, IsString } from 'class-validator';

export class PostMessagesDto {
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsInt()
  roomId: number;

  @IsNotEmpty()
  @IsString()
  message: string;
}
