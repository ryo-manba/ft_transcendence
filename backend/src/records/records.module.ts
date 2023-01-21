import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  controllers: [RecordsController],
  providers: [RecordsService, PrismaService],
  exports: [RecordsService],
})
export class RecordsModule {}
