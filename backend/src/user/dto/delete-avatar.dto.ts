import { IsNumber, IsNotEmpty, IsString } from 'class-validator';

export class DeleteAvatarDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  avatarPath: string;
}
