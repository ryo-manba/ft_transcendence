import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { GameGateway } from './game/game.gateway';

@Module({
  imports: [GameModule],
  controllers: [AppController],
  providers: [AppService, GameGateway],
})
export class AppModule {}
