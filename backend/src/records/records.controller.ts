import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { User } from '@prisma/client';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

type GameRecordWithUserName = {
  id: number;
  winnerScore: number;
  loserScore: number;
  createdAt: Date;
  loser: User;
  winner: User;
};

@UseGuards(AuthGuard('jwt'))
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  async getRecords(@Req() req: Request): Promise<GameRecordWithUserName[]> {
    return this.recordsService.gameRecords({
      where: {
        OR: [
          {
            winnerId: req.user.id as number,
          },
          {
            loserId: req.user.id as number,
          },
        ],
      },
    });
  }
}
