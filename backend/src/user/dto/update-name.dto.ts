import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const username_max_len = Number(process.env.USERNAME_MAX_LEN);

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(username_max_len)
  name: string;
}
