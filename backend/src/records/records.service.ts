import { Injectable } from '@nestjs/common';
import { GameRecord, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameRecordDto } from './dto/create-gamerecord.dto';
import { GameRecordWithUserName } from './interfaces/records.interface';

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
  }): Promise<GameRecordWithUserName[]> {
    const { skip, take, cursor, where, orderBy } = params;

    const records = await this.prisma.gameRecord.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        loser: true,
        winner: true,
      },
    });

    // UserからuserNameのみを取り出す
    const recordsWithUserName: GameRecordWithUserName[] = records.map(
      (record) => {
        return {
          id: record.id,
          winnerScore: record.winnerScore,
          loserScore: record.loserScore,
          createdAt: record.createdAt,
          loserName: record.loser.name,
          winnerName: record.winner.name,
        };
      },
    );

    return recordsWithUserName;
  }

  async createGameRecord(data: CreateGameRecordDto): Promise<GameRecord> {
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
