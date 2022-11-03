import { Module } from '@nestjs/common';
import { RecordsModule } from '../records/records.module';
import { GameGateway } from './game.gateway';

@Module({
  imports: [RecordsModule],
  providers: [GameGateway],
})
export class GameModule {}
