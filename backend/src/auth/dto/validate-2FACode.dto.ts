import { IsNotEmpty, IsString, IsNumberString } from 'class-validator';

export class Validate2FACodeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}
