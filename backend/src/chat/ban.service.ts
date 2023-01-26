import { Injectable, Logger } from '@nestjs/common';
import { Prisma, BanRelation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BanUserDto } from './dto/ban-user.dto';
import { UnbanUserDto } from './dto/unban-user.dto';

@Injectable()
export class BanService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('BanService');

  async findOne(
    BanRelationWhereUniqueInput: Prisma.BanRelationWhereUniqueInput,
  ): Promise<BanRelation | null> {
    return await this.prisma.banRelation.findUnique({
      where: BanRelationWhereUniqueInput,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BanRelationWhereUniqueInput;
    where?: Prisma.BanRelationWhereInput;
    orderBy?: Prisma.BanRelationOrderByWithRelationInput;
  }): Promise<BanRelation[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return await this.prisma.banRelation.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(createArgs: Prisma.BanRelationCreateArgs): Promise<BanRelation> {
    try {
      const createdBanRelation = await this.prisma.banRelation.create({
        data: createArgs.data,
      });

      return createdBanRelation;
    } catch (error) {
      this.logger.log('create', error);

      return undefined;
    }
  }

  async updateMany(params: {
    where: Prisma.BanRelationWhereInput;
    data: Prisma.XOR<
      Prisma.BanRelationUpdateManyMutationInput,
      Prisma.BanRelationUncheckedUpdateManyInput
    >;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    try {
      const updatedBanRelationCount = await this.prisma.banRelation.updateMany({
        where: where,
        data: data,
      });

      return updatedBanRelationCount;
    } catch (error) {
      this.logger.log('updateMany', error);

      return undefined;
    }
  }

  async update(params: {
    where: Prisma.BanRelationWhereUniqueInput;
    data: Prisma.BanRelationUpdateInput;
  }): Promise<BanRelation> {
    const { where, data } = params;
    try {
      const updatedBanRelation = await this.prisma.banRelation.update({
        where: where,
        data: data,
      });

      return updatedBanRelation;
    } catch (error) {
      this.logger.log('update', error);

      return undefined;
    }
  }

  async delete(
    where: Prisma.BanRelationWhereUniqueInput,
  ): Promise<BanRelation> {
    try {
      const deletedBanRelation = await this.prisma.banRelation.delete({
        where,
      });

      return deletedBanRelation;
    } catch (error) {
      this.logger.log('delete', error);

      return undefined;
    }
  }

  /**
   * ユーザーをBanする
   * @param BanUserDto
   */
  async banUser(dto: BanUserDto): Promise<boolean> {
    this.logger.log('banUser', dto.userId);

    const BAN_TIME_IN_DAYS = 7;
    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(startAt.getDate() + BAN_TIME_IN_DAYS);

    const createBanRelationDto: Prisma.BanRelationCreateArgs = {
      data: {
        userId: dto.userId,
        chatroomId: dto.chatroomId,
        startAt: startAt,
        endAt: endAt,
      },
    };

    const createdBanRelation = await this.create(createBanRelationDto);

    return !!createdBanRelation;
  }

  /**
   * ユーザーをUnbanする
   * @param UnbanUserDto
   */
  async unbanUser(dto: UnbanUserDto): Promise<boolean> {
    this.logger.log('unbanUser', dto.userId);

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

    // Unbanが呼ばれたがBanされていない場合
    if (targetUserRelations.length < 0) {
      return true;
    }

    const targetIds = targetUserRelations.map((relation) => {
      return relation.id;
    });

    // 不整合により同一ルームで同じ時期にBanされている場合はすべてunbanする
    const updatedBanRelationCount = await this.updateMany({
      where: {
        id: { in: targetIds },
      },
      data: {
        endAt: now,
      },
    });

    if (updatedBanRelationCount.count === 0) {
      return false;
    }

    return true;
  }
}
