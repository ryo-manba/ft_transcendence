import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAvatarPathDto {
  @IsString()
  @IsNotEmpty()
  avatarPath: string;
}
