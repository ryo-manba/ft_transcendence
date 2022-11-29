import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
// import { JwtModule } from '@nestjs/jwt';
// import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
