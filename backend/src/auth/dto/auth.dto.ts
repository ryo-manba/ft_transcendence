import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class AuthDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}
