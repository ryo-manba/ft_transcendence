import { Query, Controller, Get, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { ChatUser } from './types/chat';
import type { Message } from '@prisma/client';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * @param roomId
   * @return 以下の情報をオブジェクトの配列で返す
   * - adminではないユーザーのID
   * - adminではないユーザーの名前
   */
  @Get('non-admin')
  async findNotAdminUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findCanSetAdminUsers(roomId);
  }

  /**
   * @param roomId
   * @return 以下の情報をオブジェクトの配列で返す
   * - BANされていないユーザーのID
   * - BANされていないユーザーの名前
   */
  @Get('non-banned')
  async findNotBannedUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findNotBannedUsers(roomId);
  }

  /**
   * @param roomId
   * @return 以下を満たすユーザーのIDと名前の配列を返す
   * - StatusがNormal
   * - Adminではない
   * - オーナーではない
   */
  @Get('normal-users')
  async findChatroomNormalUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findChatroomNormalUsers(roomId);
  }

  /**
   * @param roomId
   * @return Message[]
   */
  @Get('messages')
  async findMessages(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Query('skip', ParseIntPipe) skip: number,
  ): Promise<Message[]> {
    return await this.chatService.findMessages({
      chatroomId: roomId,
      skip: skip,
    });
  }

  /**
   * @param roomId
   * @return chatroomに入室しているStatusがNormalなユーザーのIDと名前の配列を返す
   */
  @Get('active-users')
  async findActiveUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findChatroomActiveUsers(roomId);
  }
}
