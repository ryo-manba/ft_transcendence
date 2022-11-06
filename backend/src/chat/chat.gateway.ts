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

  handleConnection(socket: Socket) {
    this.logger.log(`Connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Disconnect: ${socket.id}`);
  }

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
   * メッセージを保存してチャットルーム全体に内容を送信する
   * @param Message
   */
  @SubscribeMessage('chat:sendMessage')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageModel,
  ): Promise<any> {
    this.logger.log(`chat:sendMessage received -> ${data.roomId}`);
    await this.chatService.addMessage(data);
    this.server.to(String(data.roomId)).emit('chat:receiveMessage', data);
  }

  /**
   * チャットルームに入室する
   * @param RoomID
   */
  @SubscribeMessage('chat:joinRoom')
  async JoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ): Promise<any> {
    this.logger.log(`chat:joinRoom received -> ${roomId}`);

    // roomに入っている場合は退出する
    if (client.rooms.size >= 1) {
      const target = Array.from(client.rooms)[1];
      await client.leave(target);
    }
    await client.join(String(roomId));

    // 既存のメッセージを取得する
    // TODO: limitで上限をつける
    const messages = await this.chatService.findMessages({ id: roomId });
    // 既存のメッセージを送り返す
    client.emit('chat:joinRoom', messages);
  }

  /**
   * チャットルームから退出する
   * @param client
   * @param data
   */
  @SubscribeMessage('chat:leaveRoom')
  async onRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ): Promise<any> {
    this.logger.log(`chat:leaveRoom received -> ${roomId}`);
    await client.leave(String(roomId));
  }
}
