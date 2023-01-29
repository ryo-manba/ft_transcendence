import { Injectable, Logger } from '@nestjs/common';
import { Prisma, BlockRelation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockUserDto } from './dto/block/block-user.dto';
import { UnblockUserDto } from './dto/block/unblock-user.dto';
import { GetUnblockedUsersDto } from './dto/block/get-unblocked-users.dto';
import { IsBlockedDto } from './dto/block/is-blocked.dto';

import type { ChatUser } from './types/chat';

@Injectable()
export class BlockService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('BlockService');

  async findOne(
    blockRelationWhereUniqueInput: Prisma.BlockRelationWhereUniqueInput,
  ): Promise<BlockRelation | null> {
    return await this.prisma.blockRelation.findUnique({
      where: blockRelationWhereUniqueInput,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BlockRelationWhereUniqueInput;
    where?: Prisma.BlockRelationWhereInput;
    orderBy?: Prisma.BlockRelationOrderByWithRelationInput;
  }): Promise<BlockRelation[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return await this.prisma.blockRelation.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(
    createArgs: Prisma.BlockRelationCreateArgs,
  ): Promise<BlockRelation> {
    try {
      const createdBlockRelation = await this.prisma.blockRelation.create({
        data: createArgs.data,
      });

      return createdBlockRelation;
    } catch (error) {
      this.logger.log('create', error);

      return undefined;
    }
  }

  async update(params: {
    where: Prisma.BlockRelationWhereUniqueInput;
    data: Prisma.BlockRelationUpdateInput;
  }): Promise<BlockRelation> {
    const { where, data } = params;
    try {
      const updatedBlockRelation = await this.prisma.blockRelation.update({
        where: where,
        data: data,
      });

      return updatedBlockRelation;
    } catch (error) {
      this.logger.log('update', error);

      return undefined;
    }
  }

  async delete(
    where: Prisma.BlockRelationWhereUniqueInput,
  ): Promise<BlockRelation> {
    try {
      const deletedBlockRelation = await this.prisma.blockRelation.delete({
        where,
      });

      return deletedBlockRelation;
    } catch (error) {
      this.logger.log('delete', error);

      return undefined;
    }
  }

  /**
   * 次のブロック処理を行う
   * - BlockUserRelationにデータを作成する
   * - ブロックしたユーザとのフレンド関係を削除する
   * @param CreateBlockUserDto
   */
  async blockUser(dto: BlockUserDto): Promise<boolean> {
    this.logger.log('blockUser: ', dto.blockingUserId);

    const blockRelation = await this.create({
      data: dto,
    });
    if (!blockRelation) {
      return undefined;
    }

    // ブロックしたユーザとのフレンド関係を削除する
    try {
      await this.prisma.friendRelation.deleteMany({
        where: {
          OR: [
            {
              followerId: dto.blockedByUserId,
              followingId: dto.blockingUserId,
            },
            {
              followerId: dto.blockingUserId,
              followingId: dto.blockedByUserId,
            },
          ],
        },
      });
    } catch (error) {
      this.logger.log('blockUser', error);
    }

    return !!blockRelation;
  }

  /**
   * ブロックを解除する
   * @param UnblockUserDto
   */
  async unblockUser(dto: UnblockUserDto): Promise<boolean> {
    this.logger.log('unblockUser: ', dto.blockingUserId);

    try {
      const blockRelation = await this.delete({
        blockingUserId_blockedByUserId: {
          ...dto,
        },
      });

      return !!blockRelation;
    } catch (error) {
      this.logger.log('unblockUser', error);

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
   * @param GetUnblockedUsersDto
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

  /**
   * ブロックされているかどうかを判定する
   * @param IsBlockDto
   */
  async isBlocked(dto: IsBlockedDto): Promise<boolean> {
    const blockRelation = await this.findOne({
      blockingUserId_blockedByUserId: {
        ...dto,
      },
    });

    return !!blockRelation;
  }
}
