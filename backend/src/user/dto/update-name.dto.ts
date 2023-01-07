import { IsNumber, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const usernameMaxLen = 50;

export class UpdateNameDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(usernameMaxLen)
  name: string;
}
