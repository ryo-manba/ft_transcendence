import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ChatService } from './chat.service';
import { ChatRoom as ChatRoomModel } from '@prisma/client';
import { PostMessagesDto } from './dto/message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('ChatGateway');

  // 新しいクライアントが接続してきたときの処理
  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const data = await this.chatService.chatRooms({});
    this.server.emit('chat:connected', data);
  }

  /**
   * チャットルームを作成する
   * @param data
   */
  @SubscribeMessage('room:create')
  CreateRoom(@MessageBody() data: ChatRoomModel): void {
    this.logger.log(`room:create: ${data.name}`);
    // とりあえずvoidで受ける
    void this.chatService.createChatRoom(data);
    // 送信者にdataを送り返す
    this.server.emit('room:created', data);
  }

  /**
   * メッセージを受け取る
   * @param Message
   * Todo: DBに保存する
   */
  @SubscribeMessage('chat:sendMessage')
  Echo(@MessageBody() data: PostMessagesDto): void {
    this.logger.log(`chat:sendMessage received`);
    this.server.emit('chat:sendMessage', data);
  }
}
