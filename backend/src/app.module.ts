import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import { RecordsModule } from './records/records.module';

@Module({
  imports: [ChatModule, GameModule, RecordsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
