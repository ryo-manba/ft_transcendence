import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

const passwordMinLen = 5;
const usernameMaxLen = 50;

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(passwordMinLen)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(usernameMaxLen)
  username: string;
}
