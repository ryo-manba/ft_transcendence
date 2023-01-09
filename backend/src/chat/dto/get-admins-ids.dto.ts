import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetAdminsIdsDto {
  @IsNumber()
  @IsNotEmpty()
  roomId: number;
}
