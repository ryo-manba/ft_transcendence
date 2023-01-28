import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UserModule } from '../user/user.module';
import { PrismaService } from '../prisma/prisma.service';
import { BanService } from './ban.service';
import { MuteService } from './mute.service';
import { BlockService } from './block.service';

@Module({
  imports: [UserModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    PrismaService,
    BanService,
    MuteService,
    BlockService,
  ],
})
export class ChatModule {}
