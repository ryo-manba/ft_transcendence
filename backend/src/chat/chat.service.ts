import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatroomAdmin, Message, Prisma, BlockRelation } from '@prisma/client';
import type { ChatUser, ChatMessage } from './types/chat';
import { CreateAdminDto } from './dto/admin/create-admin.dto';
import { DeleteAdminDto } from './dto/admin/delete-admin.dto';
import { CreateBlockRelationDto } from './dto/block/create-block-relation.dto';
import { DeleteBlockRelationDto } from './dto/block/delete-block-relation.dto';
import { GetUnblockedUsersDto } from './dto/block/get-unblocked-users.dto';
import { CreateMessageDto } from './dto/message/create-message.dto';
import { GetMessagesDto } from './dto//message/get-messages.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('ChatService');

  async addMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    try {
      const message = await this.prisma.message.create({
        data: {
          userId: createMessageDto.userId,
          chatroomId: createMessageDto.chatroomId,
          message: createMessageDto.message,
        },
      });

      return message;
    } catch (error) {
      this.logger.log('addMessage', error);

      return undefined;
    }
  }

  /**
   * chatroomに紐づいたメッセージを取得する
   * @param GetMessagesDto
   */
  async findChatMessages(dto: GetMessagesDto): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        chatroomId: dto.chatroomId,
      },
      skip: dto.pageSize * dto.skip,
      take: dto.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const chatMessages = messages.map((message) => {
      return {
        roomId: message.chatroomId,
        text: message.message,
        userId: message.userId,
        userName: message.user.name,
        createdAt: message.createdAt,
      };
    });

    return chatMessages;
  }

  /**
   * admin一覧を返す
   * @param chatroomId
   */
  async findAdmins(chatroomId: number): Promise<ChatroomAdmin[]> {
    const admins = await this.prisma.chatroomAdmin.findMany({
      where: {
        chatroomId: chatroomId,
      },
    });

    return admins;
  }

  /**
   * チャットルームのadminを作成する
   * @param CreateAdminDto
   */
  async createAdmin(dto: CreateAdminDto): Promise<ChatroomAdmin> {
    try {
      const admin = await this.prisma.chatroomAdmin.create({
        data: {
          ...dto,
        },
      });

      return admin;
    } catch (error) {
      this.logger.log('createAdmin', error);

      return undefined;
    }
  }

  /**
   * チャットルームのadminを削除する
   * @param CreateAdminDto
   */
  async deleteAdmin(dto: DeleteAdminDto): Promise<ChatroomAdmin> {
    try {
      const deletedAdmin = await this.prisma.chatroomAdmin.delete({
        where: {
          chatroomId_userId: {
            ...dto,
          },
        },
      });

      return deletedAdmin;
    } catch (error) {
      this.logger.log('deleteAdmin', error);

      return undefined;
    }
  }

  /**
   * BlockRelationにデータを作成する
   * @param CreateBlockRelationDto
   */
  async createBlockRelation(
    dto: CreateBlockRelationDto,
  ): Promise<BlockRelation> {
    this.logger.log('createBlockRelation: ', dto);
    try {
      const blockRelation = await this.prisma.blockRelation.create({
        data: {
          ...dto,
        },
      });

      return blockRelation;
    } catch (error) {
      this.logger.log('createBlockRelation: : ', error);

      return undefined;
    }
  }

  /**
   * 次のブロック処理を行う
   * - BlockUserRelationにデータを作成する
   * - ブロックしたユーザとのフレンド関係を削除する
   * @param CreateBlockUserDto
   */
  async blockUser(dto: CreateBlockRelationDto): Promise<BlockRelation> {
    this.logger.log('blockUser: ', dto);

    const blockRelation = await this.createBlockRelation(dto);
    if (!blockRelation) {
      return undefined;
    }

    // ブロックしたユーザとのフレンド関係を削除する
    const wheres = [
      { followerId: dto.blockedByUserId, followingId: dto.blockingUserId },
      { followerId: dto.blockingUserId, followingId: dto.blockedByUserId },
    ];
    try {
      await this.prisma.friendRelation.deleteMany({
        where: {
          OR: [...wheres],
        },
      });
    } catch (error) {
      this.logger.log('blockUser: ', error);
    }

    return blockRelation;
  }

  /**
   * ブロックを解除する
   * @param CreateBlockUserDto
   */
  async unblockUser(dto: DeleteBlockRelationDto): Promise<BlockRelation> {
    this.logger.log('unblockUser: ', dto);

    try {
      const blockRelation = await this.prisma.blockRelation.delete({
        where: {
          blockingUserId_blockedByUserId: {
            ...dto,
          },
        },
      });

      return blockRelation;
    } catch (error) {
      this.logger.log('unblockUser: ', error);

      return undefined;
    }
  }

  /**
   * ブロックされているユーザ一覧を返す
   * @param Prisma.BlockRelationWhereInput
   */
  async findBlockedUsers(
    where: Prisma.BlockRelationWhereInput,
  ): Promise<ChatUser[]> {
    this.logger.log('findBlockedUsers: ', where);

    const blockedUsers = await this.prisma.blockRelation.findMany({
      where: where,
      include: {
        blocking: true,
      },
    });

    const chatBlockedUsers: ChatUser[] = blockedUsers.map((user) => {
      return {
        id: user.blocking.id,
        name: user.blocking.name,
      };
    });

    return chatBlockedUsers;
  }

  /**
   * ブロックされていないユーザ一覧を返す
   * @param Prisma.BlockRelationWhereInput
   */
  async findUnblockedUsers(dto: GetUnblockedUsersDto): Promise<ChatUser[]> {
    this.logger.log('findUnlockedUsers: ', dto.blockedByUserId);

    const blockedUsers = await this.prisma.blockRelation.findMany({
      where: {
        blockedByUserId: dto.blockedByUserId,
      },
    });
    const blockingUserIds = blockedUsers.map((user) => user.blockingUserId);

    const unblockedUsers = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: dto.blockedByUserId } },
          { id: { notIn: blockingUserIds } },
        ],
      },
    });

    const chatUnblockedUsers: ChatUser[] = unblockedUsers.map((user) => {
      return {
        id: user.id,
        name: user.name,
      };
    });

    return chatUnblockedUsers;
  }
}
