import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateChatroomOwnerDto {
  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsNumber()
  @IsNotEmpty()
  ownerId: number;
}
