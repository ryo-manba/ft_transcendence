import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { ChatroomMembersStatus } from '@prisma/client';

export class updateMemberStatusDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  chatroomId: number;

  @IsEnum(ChatroomMembersStatus)
  @IsNotEmpty()
  status: ChatroomMembersStatus;
}
