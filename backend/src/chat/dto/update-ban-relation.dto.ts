import { IsDate, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class UpdateBanRelationDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsDate()
  @IsOptional()
  startAt?: Date;

  @IsDate()
  @IsOptional()
  endAt?: Date;
}
