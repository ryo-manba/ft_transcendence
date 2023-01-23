import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDirectMessageDto {
  @IsNumber()
  @IsNotEmpty()
  senderId: number;

  @IsNumber()
  @IsNotEmpty()
  recipientId: number;

  @IsString()
  @IsNotEmpty()
  senderName: string;

  @IsString()
  @IsNotEmpty()
  recipientName: string;
}
