import { Query, Controller, Get, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { ChatUser, ChatMessage } from './types/chat';

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
   * @return 以下の情報をオブジェクトの配列で返す
   * - MUTEされているユーザーのID
   * - MUTEされているユーザーの名前
   */
  @Get('muted-users')
  async findMutedUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findMutedUsers(roomId);
  }

  /**
   * @param roomId
   * @return 以下を満たすユーザーのIDと名前の配列を返す
   * - BANされているユーザーのID
   * - BANされているユーザーの名前
   */
  @Get('banned-users')
  async findChatroomBannedUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findChatroomBannedUsers(roomId);
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

  // /**
  //  * @return ブロックされていないユーザ一覧を返す
  //  * @param userId
  //  */
  // @Get('unblocked-users')
  // async findUnblockedChatUsers(
  //   @Query('userId', ParseIntPipe) userId: number,
  // ): Promise<ChatUser[]> {
  //   const chatUsers = await this.findAllChatUsers();

  //   const blockedUsers = await this.chatService.findUnblockedUsers({
  //     blockedByUserId: userId,
  //   });

  //   const blockingUserIds = blockedUsers.map((user) => user.id);

  //   // すべてのユーザーからブロックされているユーザーを除去する
  //   const unblockedUsers = chatUsers.filter(
  //     (user) => !blockingUserIds.includes(user.id),
  //   );

  //   return unblockedUsers;
  // }

  /**
   * @return ブロックされているユーザ一覧を返す
   * @param userId
   */
  @Get('blocked-users')
  async findBlockedChatUsers(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ChatUser[]> {
    const blockedUsers = await this.chatService.findBlockedUsers({
      blockedByUserId: userId,
    });

    return blockedUsers;
  }
}
