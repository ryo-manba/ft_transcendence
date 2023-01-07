import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateAvatarDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  avatarPath: string;
}
