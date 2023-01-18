import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetUnblockedUsersDto {
  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
