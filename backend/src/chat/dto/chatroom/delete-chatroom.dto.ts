import { IsNotEmpty, IsInt } from 'class-validator';

export class DeleteChatroomDto {
  @IsNotEmpty()
  @IsInt()
  id: number;

  @IsNotEmpty()
  @IsInt()
  userId: number;
}
