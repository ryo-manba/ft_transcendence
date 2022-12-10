import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [FriendsController],
  providers: [FriendsService, UserService],
})
export class FriendsModule {}
