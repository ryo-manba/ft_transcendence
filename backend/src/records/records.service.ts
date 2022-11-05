import { Injectable } from '@nestjs/common';
import { GameRecord, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async gameRecord(
    gameRecordWhereUniqueInput: Prisma.GameRecordWhereUniqueInput,
  ): Promise<GameRecord | null> {
    return this.prisma.gameRecord.findUnique({
      where: gameRecordWhereUniqueInput,
    });
  }

  async gameRecords(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GameRecordWhereUniqueInput;
    where?: Prisma.GameRecordWhereInput;
    orderBy?: Prisma.UserOrderByWithAggregationInput;
  }): Promise<GameRecord[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.gameRecord.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createGameRecord(
    data: Prisma.GameRecordCreateInput,
  ): Promise<GameRecord> {
    return this.prisma.gameRecord.create({
      data,
    });
  }

  async updateGameRecord(params: {
    where: Prisma.GameRecordWhereUniqueInput;
    data: Prisma.GameRecordUpdateInput;
  }): Promise<GameRecord> {
    const { where, data } = params;

    return this.prisma.gameRecord.update({
      data,
      where,
    });
  }

  async deleteGameRecord(
    where: Prisma.GameRecordWhereUniqueInput,
  ): Promise<GameRecord> {
    return this.prisma.gameRecord.delete({
      where,
    });
  }
}
