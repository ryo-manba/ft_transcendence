import { IsNotEmpty, IsNumber } from 'class-validator';

export class OnGetRoomsDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
