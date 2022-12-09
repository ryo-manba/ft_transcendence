import { IsNotEmpty, IsString, IsUUID, IsNumberString } from 'class-validator';

export class SecretCodeDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}
