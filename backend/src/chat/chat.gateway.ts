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
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { DeleteChatroomDto } from './dto/delete-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';

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
  async CreateRoom(@MessageBody() data: CreateChatroomDto): Promise<any> {
    this.logger.log(`chat:create': ${data.name}`);
    const res = await this.chatService.create(data);

    // TODO: チャットルームを見ることができるユーザーにデータを送信する
    return res;
  }

  /**
   * チャットルーム一覧を返す
   */
  @SubscribeMessage('chat:getRooms')
  async GetRooms(@ConnectedSocket() client: Socket) {
    this.logger.log(`chat:getRooms: ${client.id}`);
    const data = await this.chatService.findAll({});
    this.server.emit('chat:getRooms', data);
  }

  /**
   * メッセージを保存してチャットルーム全体に内容を送信する
   * @param Message
   */
  @SubscribeMessage('chat:sendMessage')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ): Promise<any> {
    this.logger.log(
      `chat:sendMessage received -> ${createMessageDto.chatroomId}`,
    );
    await this.chatService.addMessage(createMessageDto);
    this.server
      .to(String(createMessageDto.chatroomId))
      .emit('chat:receiveMessage', createMessageDto);
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

    // 0番目には、socketのidが入っている
    if (client.rooms.size >= 2) {
      // roomに入っている場合は退出する
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
   * @param roomId
   */
  @SubscribeMessage('chat:leaveRoom')
  async onRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ): Promise<any> {
    this.logger.log(`chat:leaveRoom received -> ${roomId}`);
    await client.leave(String(roomId));
  }

  /**
   * チャットルームを削除する
   * @param client
   * @param roomId
   */
  @SubscribeMessage('chat:deleteRoom')
  async onRoomDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() deleteChatroomDto: DeleteChatroomDto,
  ): Promise<any> {
    this.logger.log(
      `chat:deleteRoom received -> roomId: ${deleteChatroomDto.id}, userId: ${deleteChatroomDto.userId}`,
    );
    const roomId = deleteChatroomDto.id;
    const userId = deleteChatroomDto.userId;

    const data = { id: deleteChatroomDto.id };
    const room = await this.chatService.findOne(data);
    const admins = await this.chatService.findAdmins(roomId);

    // 削除を実行したユーザーがadminに含まれているかを確かめる
    const isAdmin = admins.findIndex((admin) => admin.userId === userId) != -1;

    // adminかownerの場合削除が実行できる
    if (isAdmin || room.ownerId === userId) {
      await this.chatService.remove(data);
    }
  }
}
