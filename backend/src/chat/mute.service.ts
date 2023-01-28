import { Injectable, Logger } from '@nestjs/common';
import { Prisma, MuteRelation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MuteUserDto } from './dto/mute/mute-user.dto';
import { UnmuteUserDto } from './dto/mute/unmute-user.dto';
import { IsMutedDto } from './dto/mute/is-muted.dto';
import type { ChatUser } from './types/chat';

@Injectable()
export class MuteService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('MuteService');

  async findOne(
    MuteRelationWhereUniqueInput: Prisma.MuteRelationWhereUniqueInput,
  ): Promise<MuteRelation | null> {
    return await this.prisma.muteRelation.findUnique({
      where: MuteRelationWhereUniqueInput,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.MuteRelationWhereUniqueInput;
    where?: Prisma.MuteRelationWhereInput;
    orderBy?: Prisma.MuteRelationOrderByWithRelationInput;
  }): Promise<MuteRelation[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return await this.prisma.muteRelation.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(
    createArgs: Prisma.MuteRelationCreateArgs,
  ): Promise<MuteRelation> {
    try {
      const createdMuteRelation = await this.prisma.muteRelation.create({
        data: createArgs.data,
      });

      return createdMuteRelation;
    } catch (error) {
      this.logger.log('create', error);

      return undefined;
    }
  }

  async updateMany(params: {
    where: Prisma.MuteRelationWhereInput;
    data: Prisma.XOR<
      Prisma.MuteRelationUpdateManyMutationInput,
      Prisma.MuteRelationUncheckedUpdateManyInput
    >;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    try {
      const updatedMuteRelationCount =
        await this.prisma.muteRelation.updateMany({
          where: where,
          data: data,
        });

      return updatedMuteRelationCount;
    } catch (error) {
      this.logger.log('updateMany', error);

      return undefined;
    }
  }

  async update(params: {
    where: Prisma.MuteRelationWhereUniqueInput;
    data: Prisma.MuteRelationUpdateInput;
  }): Promise<MuteRelation> {
    const { where, data } = params;
    try {
      const updatedMuteRelation = await this.prisma.muteRelation.update({
        where: where,
        data: data,
      });

      return updatedMuteRelation;
    } catch (error) {
      this.logger.log('update', error);

      return undefined;
    }
  }

  async delete(
    where: Prisma.MuteRelationWhereUniqueInput,
  ): Promise<MuteRelation> {
    try {
      const deletedMuteRelation = await this.prisma.muteRelation.delete({
        where,
      });

      return deletedMuteRelation;
    } catch (error) {
      this.logger.log('delete', error);

      return undefined;
    }
  }

  /**
   * ユーザーをMuteする
   * @param MuteUserDto
   */
  async muteUser(dto: MuteUserDto): Promise<boolean> {
    this.logger.log('muteUser', dto.userId);

    const MUTE_TIME_IN_DAYS = 7;
    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(startAt.getDate() + MUTE_TIME_IN_DAYS);

    const createMuteRelationDto: Prisma.MuteRelationCreateArgs = {
      data: {
        userId: dto.userId,
        chatroomId: dto.chatroomId,
        startAt: startAt,
        endAt: endAt,
      },
    };

    const createdMuteRelation = await this.create(createMuteRelationDto);

    return !!createdMuteRelation;
  }

  /**
   * ユーザーをUnmuteする
   * @param UnmuteUserDto
   */
  async unmuteUser(dto: UnmuteUserDto): Promise<boolean> {
    this.logger.log('unmuteUser', dto.userId);

    // NOTE: endAtを現在時刻にすることでban状態を終了させる
    const now = new Date();
    const targetUserRelations = await this.findAll({
      where: {
        userId: dto.userId,
        chatroomId: dto.chatroomId,
        startAt: {
          lte: now,
        },
        endAt: {
          gt: now,
        },
      },
    });

    // Unmuteが呼ばれたがMuteされていない場合
    if (targetUserRelations.length < 0) {
      return true;
    }

    const targetIds = targetUserRelations.map((relation) => {
      return relation.id;
    });

    // 不整合により同一ルームで同じ時期にMuteされている場合はすべてunmuteする
    const updatedMuteRelationCount = await this.updateMany({
      where: {
        id: { in: targetIds },
      },
      data: {
        endAt: now,
      },
    });

    if (updatedMuteRelationCount.count === 0) {
      return false;
    }

    return true;
  }

  /**
   * Muteされているユーザ一覧を返す
   * @param chatroomId
   */
  async findMutedUsers(chatroomId: number): Promise<ChatUser[]> {
    const now = new Date();
    const mutedUsersRelation = await this.prisma.muteRelation.findMany({
      where: {
        chatroomId: chatroomId,
        startAt: {
          lte: now,
        },
        endAt: {
          gt: now,
        },
      },
      include: {
        user: true,
      },
    });

    if (mutedUsersRelation.length === 0) {
      return [];
    }

    const mutedUsers: ChatUser[] = mutedUsersRelation.map((relation) => {
      return {
        id: relation.user.id,
        name: relation.user.name,
      };
    });

    return mutedUsers;
  }

  /**
   * Muteされているか判定する
   * @param IsMutedDto
   */
  async isMuted(dto: IsMutedDto): Promise<boolean> {
    const now = new Date();
    const mutedUsers = await this.findAll({
      where: {
        chatroomId: dto.chatroomId,
        userId: dto.userId,
        startAt: {
          lte: now,
        },
        endAt: {
          gt: now,
        },
      },
    });

    const isMuted = mutedUsers.length > 0;

    return isMuted;
  }
}
