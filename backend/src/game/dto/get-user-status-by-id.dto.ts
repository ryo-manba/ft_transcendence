import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetUserStatusByIdDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
