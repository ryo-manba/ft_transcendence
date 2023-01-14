import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ChatroomType } from '@prisma/client';

const maxChatroomNameLength = 100;

export class CreateChatroomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(maxChatroomNameLength)
  name: string;

  @IsEnum(ChatroomType)
  @IsNotEmpty()
  type: ChatroomType;

  @IsNumber()
  @IsNotEmpty()
  ownerId: number;

  @IsString()
  @IsOptional()
  password?: string;
}
