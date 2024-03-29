import { Query, Controller, Get, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { BanService } from './ban.service';
import { MuteService } from './mute.service';
import { BlockService } from './block.service';
import { AdminService } from './admin.service';
import { ChatroomService } from './chatroom.service';
import type { ChatUser, ChatMessage } from './types/chat';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly banService: BanService,
    private readonly muteService: MuteService,
    private readonly blockService: BlockService,
    private readonly adminService: AdminService,
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
    const adminUsers = await this.adminService.findAdmins(roomId);
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
   * Muteできるユーザ一覧を返す
   * - Muteされていない
   * - Ownerではない
   * @param roomId
   */
  @Get('can-mute')
  async findCanMuteUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    const mutedUsers = await this.muteService.findMutedUsers(roomId);
    const chatroomOwner = await this.chatroomService.findChatroomOwner(roomId);

    const mutedIds = mutedUsers.map((user) => user.id);
    const ownerId = chatroomOwner.id;

    const excludeIdSets = new Set([...mutedIds, ownerId]);
    const excludeIds = [...excludeIdSets];

    // すべてを満たさないUser一覧を取得する
    const canMuteUsers =
      await this.chatroomService.findChatroomMembersAsChatUsers({
        where: {
          chatroomId: roomId,
          userId: {
            notIn: excludeIds,
          },
        },
      });

    return canMuteUsers;
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
   * - Banされていない
   * - Ownerではない
   * @param roomId
   */
  @Get('can-ban')
  async findCanBanUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    const bannedUsers = await this.banService.findBannedUsers(roomId);
    const chatroomOwner = await this.chatroomService.findChatroomOwner(roomId);

    const bannedIds = bannedUsers.map((user) => user.id);
    const ownerId = chatroomOwner.id;

    const excludeIdSets = new Set([...bannedIds, ownerId]);
    const excludeIds = [...excludeIdSets];

    // すべてを満たさないUser一覧を取得する
    const canBanUsers =
      await this.chatroomService.findChatroomMembersAsChatUsers({
        where: {
          chatroomId: roomId,
          userId: {
            notIn: excludeIds,
          },
        },
      });

    return canBanUsers;
  }

  /**
   * チャットのメッセージを返す
   * @param roomId
   */
  @Get('messages')
  async findChatMessages(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('skip', ParseIntPipe) skip: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
  ): Promise<ChatMessage[]> {
    const chatMessages = await this.chatService.findChatMessages({
      chatroomId: roomId,
      userId: userId,
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
    const unblockedUsers = this.blockService.findUnblockedUsers({
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
    const blockedUsers = await this.blockService.findBlockedUsers({
      blockedByUserId: userId,
    });

    return blockedUsers;
  }

  /**
   * @return DMの相手のユーザー名を返す
   * @param roomId
   * @param senderUserId (自分のユーザー名)
   */
  @Get('dm-recipient-name')
  async findDMRecipientName(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Query('senderUserId', ParseIntPipe) senderUserId: number,
  ): Promise<string> {
    const recipientName = await this.chatroomService.findDMRecipientName(
      roomId,
      senderUserId,
    );

    return recipientName;
  }

  /**
   * @return list of users who can be kicked
   * @param roomId
   * @param userId
   *
   * Owners can kick everyone including admins
   * Admins can kick everyone except owners
   */
  @Get('can-kick')
  async findCanKickUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<ChatUser[]> {
    const chatroomOwner = await this.chatroomService.findChatroomOwner(roomId);

    const ownerId = chatroomOwner.id;

    const excludeIdSet = new Set([ownerId, userId]);
    const excludeIds = [...excludeIdSet];

    const canKickUsers =
      await this.chatroomService.findChatroomMembersAsChatUsers({
        where: {
          chatroomId: roomId,
          userId: {
            notIn: excludeIds,
          },
        },
      });

    return canKickUsers;
  }
}
