import { IsNotEmpty, IsNumber } from 'class-validator';

export class IsBlockedDto {
  @IsNumber()
  @IsNotEmpty()
  blockingUserId: number;

  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
