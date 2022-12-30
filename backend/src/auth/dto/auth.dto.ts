import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

const passwordMinLen = Number(process.env.PASSWORD_MIN_LEN);
const usernameMaxLen = Number(process.env.USERNAME_MAX_LEN);

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
