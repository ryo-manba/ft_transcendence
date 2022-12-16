import { IsNotEmpty, IsString } from 'class-validator';
export class CreateOAuthDto {
  @IsString()
  @IsNotEmpty()
  oAuthId: string;

  @IsString()
  imagePath: string;
}
