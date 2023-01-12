import { Query, Controller, Get, ParseIntPipe, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { ChatUser, ChatMessage } from './types/chat';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  private logger: Logger = new Logger('ChatController');

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
  async findChatMessages(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
  ): Promise<ChatMessage[]> {
    this.logger.log(`findChatMessages: {
                        roomId:   ${roomId}
                        skip:     ${skip}
                        pageSize: ${pageSize}
                    }`);

    const chatMessages = await this.chatService.findChatMessages({
      chatroomId: roomId,
      skip: skip,
      pageSize: pageSize,
    });

    /**
     * 新しい順にpageSize取得したものを古い順に並び替えることでTimelineの並び順にする
     * 新 -> 古 を 古 -> 新 にする
     */
    return chatMessages.reverse();
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
