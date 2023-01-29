import { Query, Controller, Get, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { BanService } from './ban.service';
import { MuteService } from './mute.service';
import { ChatroomService } from './chatroom.service';
import type { ChatUser, ChatMessage } from './types/chat';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly banService: BanService,
    private readonly muteService: MuteService,
    private readonly chatroomService: ChatroomService,
  ) {}

  /**
   * @param roomId
   * 以下の条件を満たすユーザ一覧を返す
   * - Adminではない
   * - Ownerではない
   * - Muteされていない
   * - Banされていない
   */
  @Get('can-set-admin')
  async findCanSetAdminUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    const adminUsers = await this.chatService.findAdmins(roomId);
    const bannedUsers = await this.banService.findBannedUsers(roomId);
    const mutedUsers = await this.muteService.findMutedUsers(roomId);
    const chatroomOwner = await this.chatroomService.findChatroomOwner(roomId);

    const adminIds = adminUsers.map((admin) => admin.userId);
    const bannedIds = bannedUsers.map((user) => user.id);
    const mutedIds = mutedUsers.map((user) => user.id);
    const ownerId = chatroomOwner.id;

    const excludeIdSets = new Set([
      ...adminIds,
      ...bannedIds,
      ...mutedIds,
      ownerId,
    ]);
    const excludeIds = [...excludeIdSets];

    // すべてを満たさないUser一覧を取得する
    const canSetAdminUsers =
      await this.chatroomService.findChatroomMembersAsChatUsers({
        where: {
          chatroomId: roomId,
          userId: {
            notIn: excludeIds,
          },
        },
      });

    return canSetAdminUsers;
  }

  /**
   * chatroomに入室していて、以下の条件を満たすユーザ一覧を返す
   * - Banされていない
   * - Muteされていない
   * - Ownerではない
   * @param roomId
   */
  @Get('can-set-owner')
  async findCanSetOwnerUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    const bannedUsers = await this.banService.findBannedUsers(roomId);
    const mutedUsers = await this.muteService.findMutedUsers(roomId);
    const chatroomOwner = await this.chatroomService.findChatroomOwner(roomId);

    const bannedIds = bannedUsers.map((user) => user.id);
    const mutedIds = mutedUsers.map((user) => user.id);
    const ownerId = chatroomOwner.id;

    const excludeIdSets = new Set([...bannedIds, ...mutedIds, ownerId]);
    const excludeIds = [...excludeIdSets];

    // すべてを満たさないUser一覧を取得する
    const canSetOwnerUsers =
      await this.chatroomService.findChatroomMembersAsChatUsers({
        where: {
          chatroomId: roomId,
          userId: {
            notIn: excludeIds,
          },
        },
      });

    return canSetOwnerUsers;
  }

  /**
   * Muteされているユーザ一覧を返す
   * @param roomId
   */
  @Get('muted-users')
  async findMutedUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.muteService.findMutedUsers(roomId);
  }

  /**
   * Muteされていないユーザ一覧を返す
   * @param roomId
   */
  @Get('not-muted')
  async findNotMutedUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    const chatroomUsers =
      await this.chatroomService.findChatroomMembersAsChatUsers({
        where: {
          chatroomId: roomId,
        },
      });
    const mutedUsers = await this.muteService.findMutedUsers(roomId);
    if (mutedUsers.length === 0) {
      return chatroomUsers;
    }

    const mutedIds = mutedUsers.map((user) => user.id);
    const notBannedUsers = chatroomUsers.filter(
      (user) => !mutedIds.includes(user.id),
    );

    return notBannedUsers;
  }

  /**
   * Banされているユーザ一覧を返す
   * @param roomId
   */
  @Get('banned-users')
  async findBannedUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.banService.findBannedUsers(roomId);
  }

  /**
   * Banされていないユーザ一覧を返す
   * @param roomId
   */
  @Get('not-banned')
  async findNotBannedUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    const chatroomUsers =
      await this.chatroomService.findChatroomMembersAsChatUsers({
        where: {
          chatroomId: roomId,
        },
      });

    const bannedUsers = await this.banService.findBannedUsers(roomId);
    if (bannedUsers.length === 0) {
      return chatroomUsers;
    }

    const bannedIds = bannedUsers.map((user) => user.id);
    const notBannedUsers = chatroomUsers.filter(
      (user) => !bannedIds.includes(user.id),
    );

    return notBannedUsers;
  }

  /**
   * チャットのメッセージを返す
   * @param roomId
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
   * @return ブロックされていないユーザ一覧を返す
   * @param userId
   */
  @Get('unblocked-users')
  async findUnblockedChatUsers(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ChatUser[]> {
    const unblockedUsers = this.chatService.findUnblockedUsers({
      blockedByUserId: userId,
    });

    return unblockedUsers;
  }

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
