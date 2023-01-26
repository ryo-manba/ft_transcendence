import { IsNotEmpty, IsNumber } from 'class-validator';

export class IsMutedDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;
}
