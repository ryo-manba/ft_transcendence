import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { RecordsModule } from '../records/records.module';
import { GameGateway } from './game.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RecordsModule, UserModule, AuthModule],
  providers: [GameGateway],
})
export class GameModule {}
