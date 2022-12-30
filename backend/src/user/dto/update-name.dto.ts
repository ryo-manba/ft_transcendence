import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const usernameMaxLen = Number(process.env.USERNAME_MAX_LEN);

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(usernameMaxLen)
  name: string;
}
