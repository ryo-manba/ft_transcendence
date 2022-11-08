import { Controller, Get } from '@nestjs/common';
import { RecordsService } from './records.service';
import { GameRecord } from '@prisma/client';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  getRecords(): Promise<GameRecord[]> {
    return this.recordsService.gameRecords({});
  }
}
