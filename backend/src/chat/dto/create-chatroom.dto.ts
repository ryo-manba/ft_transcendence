import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ChatroomType } from '@prisma/client';

export class CreateChatroomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ChatroomType)
  @IsNotEmpty()
  type: ChatroomType;

  @IsNumber()
  @IsNotEmpty()
  ownerId: number;

  @IsString()
  @IsOptional()
  hashedPassword?: string;
}
