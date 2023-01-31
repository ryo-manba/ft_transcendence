import { IsNotEmpty, IsNumber } from 'class-validator';

export class BlockUserDto {
  @IsNumber()
  @IsNotEmpty()
  blockingUserId: number;

  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
