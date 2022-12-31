import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const usernameMaxLen = 50;

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(usernameMaxLen)
  name: string;
}
