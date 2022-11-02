import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RecordsService } from './records.service';

@Module({
  providers: [RecordsService, PrismaService],
  exports: [RecordsService],
})
export class RecordsModule {}
