import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ChatService } from './chat.service';
import { ChatRoom as ChatRoomModel } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway {
  constructor(
    private prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('ChatGateway');

  @SubscribeMessage('room:create')
  CreateRoom(@MessageBody() data: ChatRoomModel): void {
    this.logger.log(`[DEBUG] room:create': ${data.name}`);
    // とりあえずvoidで受ける
    void this.chatService.createChatRoom(data);
    // 送信者にdataを送り返す
    this.server.emit('room:created', data);
  }
}
