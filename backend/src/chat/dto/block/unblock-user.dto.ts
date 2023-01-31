import { IsNotEmpty, IsNumber } from 'class-validator';

export class UnblockUserDto {
  @IsNumber()
  @IsNotEmpty()
  blockingUserId: number;

  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
