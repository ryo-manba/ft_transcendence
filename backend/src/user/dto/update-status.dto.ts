import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
