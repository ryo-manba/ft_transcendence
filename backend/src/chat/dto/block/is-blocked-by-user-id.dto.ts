import { IsNotEmpty, IsNumber } from 'class-validator';

export class IsBlockedByUserIdDto {
  @IsNumber()
  @IsNotEmpty()
  blockingUserId: number;

  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
