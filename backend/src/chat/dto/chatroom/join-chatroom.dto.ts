import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ChatroomType } from '@prisma/client';

export class JoinChatroomDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsEnum(ChatroomType)
  @IsNotEmpty()
  type: ChatroomType;

  @IsString()
  @IsOptional()
  password?: string;
}
