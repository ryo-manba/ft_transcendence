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
import {
  ChatRoom as ChatRoomModel,
  Message as MessageModel,
} from '@prisma/client';

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
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageModel,
  ): Promise<any> {
    this.logger.log(`chat:sendMessage received`);
    this.logger.log(`chat:roomId: ${data.roomId}`);
    await this.chatService.addMessage(data);
    this.server.to(String(data.roomId)).emit('chat:receiveMessage', data);
  }

  /**
   * @param RoomID
   */
  @SubscribeMessage('chat:joinRoom')
  JoinRoom(client: Socket, data: MessageModel): void {
    this.logger.log(`chat:joinRoom received -> ${data.roomId}`);
    this.logger.log(data);
    this.logger.log(`chat:roomId: ${data.roomId}`);

    const res = client.join(String(data.roomId));
    if (res) {
      console.log(`join: ${data.message}}`);
    }

    //    const messages = await this.chatService.findMessages(data, 25);
    // Send last messages to the connected user
    //    client.emit('message', messages);

    // メッセージを取得する
    const m1 = { userId: 1, roomId: 1, message: '111' };
    const m2 = { userId: 1, roomId: 1, message: '222' };
    const m3 = { userId: 1, roomId: 1, message: '333' };
    const m = [m1, m2, m3];

    // そのチャットルームのメッセージを送り返す
    this.server.emit('chat:joinRoom', m);
  }

  @SubscribeMessage('chat:leaveRoom')
  async onRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageModel,
  ): Promise<any> {
    this.logger.log(`chat:leaveRoom received -> ${data.roomId}`);
    await client.leave(String(data.roomId));
  }
}
