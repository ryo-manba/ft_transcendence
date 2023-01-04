import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsNumberString,
} from 'class-validator';

export class Validate2FACodeDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}
