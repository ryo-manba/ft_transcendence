import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RecordsService } from './records.service';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { GameRecordWithUserName } from './interfaces/records.interface';

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
