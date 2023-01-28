import { IsNotEmpty, IsNumber } from 'class-validator';

export class IsBlocked {
  @IsNumber()
  @IsNotEmpty()
  blockingUserId: number;

  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
