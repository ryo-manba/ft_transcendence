import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBlockRelationDto {
  @IsNumber()
  @IsNotEmpty()
  blockingUserId: number;

  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
