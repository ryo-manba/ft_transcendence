import { Query, Controller, Get, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UserService } from '../user/user.service';
import type { ChatUser } from './types/chat';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

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
   * @return chatroomに入室しているStatusがNormalなユーザーのIDと名前の配列を返す
   */
  @Get('active-users')
  async findActiveUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findChatroomActiveUsers(roomId);
  }

  /**
   * @return すべてのユーザーを取得する
   */
  @Get('all-users')
  async findAllChatUsers(): Promise<ChatUser[]> {
    const users = await this.userService.findAll({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const chatUsers = users.map((user) => {
      return {
        id: user.id,
        name: user.name,
      };
    });

    return chatUsers;
  }

  /**
   * @return ブロックされていないユーザ一覧を返す
   * @param userId
   */
  @Get('unblocked-users')
  async findUnblockedChatUsers(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ChatUser[]> {
    const chatUsers = await this.findAllChatUsers();

    const blockedUsers = await this.chatService.findBlockedUsers({
      blockedByUserId: userId,
    });
    console.log(blockedUsers);
    const blockingUserIds = blockedUsers.map((user) => user.blockingUserId);

    // すべてのユーザーからブロックされているユーザーを除去する
    const unblockedUsers = chatUsers.filter(
      (user) => !blockingUserIds.includes(user.id),
    );

    return unblockedUsers;
  }
}
