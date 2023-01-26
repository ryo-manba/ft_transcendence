import { IsNotEmpty, IsNumber } from 'class-validator';

export class IsBannedDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
