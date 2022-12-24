import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class createDirectMessageDto {
  @IsNumber()
  @IsNotEmpty()
  userId1: number;

  @IsNumber()
  @IsNotEmpty()
  userId2: number;

  @IsString()
  @IsNotEmpty()
  name1: string;

  @IsString()
  @IsNotEmpty()
  name2: string;
}
