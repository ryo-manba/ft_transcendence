import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteBlockRelationDto {
  @IsNumber()
  @IsNotEmpty()
  blockingUserId: number;

  @IsNumber()
  @IsNotEmpty()
  blockedByUserId: number;
}
