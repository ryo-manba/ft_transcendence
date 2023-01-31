import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ChatroomType } from '@prisma/client';

// DMの場合ユーザー名を2つ連結させたルーム名になる
// ユーザー名の長さの上限が50文字のため、100文字だとあふれる可能性があり、余裕を持って150に設定
const ROOM_NAME_MIN_LEN = 1;
const ROOM_NAME_MAX_LEN = 150;
const PASSWORD_MIN_LEN = 5;
const PASSWORD_MAX_LEN = 50;

export class CreateChatroomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(ROOM_NAME_MIN_LEN)
  @MaxLength(ROOM_NAME_MAX_LEN)
  name: string;

  @IsEnum(ChatroomType)
  @IsNotEmpty()
  type: ChatroomType;

  @IsNumber()
  @IsNotEmpty()
  ownerId: number;

  @IsString()
  @IsOptional()
  @MinLength(PASSWORD_MIN_LEN)
  @MaxLength(PASSWORD_MAX_LEN)
  password?: string;
}
