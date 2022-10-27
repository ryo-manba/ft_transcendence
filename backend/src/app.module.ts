import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [ChatModule, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
