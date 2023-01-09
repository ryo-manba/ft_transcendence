import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { AuthGuard } from '@nestjs/passport';
import { GameRecordWithUserName } from './interfaces/records.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get(':id')
  async getRecordsById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GameRecordWithUserName[]> {
    return this.recordsService.gameRecords({
      where: {
        OR: [
          {
            winnerId: id,
          },
          {
            loserId: id,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
