import { IsNotEmpty, IsString, IsUUID, IsNumberString } from 'class-validator';

export class Validate2FACodeDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}
