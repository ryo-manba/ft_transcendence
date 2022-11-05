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
import { PostMessagesDto } from './dto/message.dto';

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
  @SubscribeMessage('chat:create')
  CreateRoom(@MessageBody() data: ChatRoomModel): void {
    this.logger.log(`chat:create': ${data.name}`);
    // とりあえずvoidで受ける
    void this.chatService.createChatRoom(data);
    // 送信者にdataを送り返す
    this.server.emit('chat:create', data);
  }

  /**
   * チャットルーム一覧を返す
   */
  @SubscribeMessage('chat:getRooms')
  async GetRooms(@ConnectedSocket() client: Socket) {
    this.logger.log(`chat:getRooms: ${client.id}`);
    const data = await this.chatService.chatRooms({});
    this.server.emit('chat:getRooms', data);
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
