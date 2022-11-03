import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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

  /**
   * チャットルームを作成する
   */
  @SubscribeMessage('room:create')
  CreateRoom(@MessageBody() data: ChatRoomModel): void {
    this.logger.log(`room:create': ${data.name}`);
    // とりあえずvoidで受ける
    void this.chatService.createChatRoom(data);
    // 送信者にdataを送り返す
    this.server.emit('room:create', data);
  }

  /**
   * チャットルーム一覧を返す
   */
  @SubscribeMessage('room:getRooms')
  async GetRooms(@ConnectedSocket() client: Socket) {
    this.logger.log(`room:getRooms: ${client.id}`);
    const data = await this.chatService.chatRooms({});
    this.server.emit('chat:getRooms', data);
  }
}
