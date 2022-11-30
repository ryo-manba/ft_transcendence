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
import { JoinChatroomDto } from './dto/join-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Chatroom, ChatroomType } from '@prisma/client';

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
   * 作成者はそのまま入室する
   * @param CreateChatroomDto
   */
  @SubscribeMessage('chat:createRoom')
  async CreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateChatroomDto,
  ): Promise<any> {
    this.logger.log(`chat:createRoom: ${dto.name}`);

    // 作成と入室を行う
    const res = await this.chatService.createAndJoinRoom(dto);
    if (res === undefined) {
      return;
    }

    // チャットルームが作成できたら作成者のフロントエンドに反映させる
    client.emit('chat:createRoom', res);
  }

  /**
   * 入室しているチャットルーム一覧を返す
   * @params userId
   */
  @SubscribeMessage('chat:getJoinedRooms')
  async onGetRooms(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ) {
    this.logger.log(`chat:getJoinedRooms: ${userId}`);
    // ユーザーが入室しているチャットルームを取得する
    const rooms = await this.chatService.findJoinedRooms(userId);
    // フロントエンドへ送り返す
    client.emit('chat:getJoinedRooms', rooms);
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
   * チャットルームに対応したメッセージを取得して返す
   * @param RoomID
   */
  @SubscribeMessage('chat:getMessage')
  async onGetMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ): Promise<any> {
    this.logger.log(`chat:getMessage received -> ${roomId}`);

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
    client.emit('chat:getMessage', messages);
  }

  /**
   * チャットルームに入室する
   * @param client
   * @param JoinChatroomDto
   */
  @SubscribeMessage('chat:joinRoom')
  async onRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinChatroomDto,
  ): Promise<any> {
    this.logger.log(`chat:joinRoom received -> ${dto.userId}`);

    const joinedRoom = await this.chatService.joinRoom(dto);

    // 入室したルーム or undefinedをクライアントに送信する
    client.emit('chat:joinRoom', joinedRoom);
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
      const deletedRoom = await this.chatService.remove(data);
      if (deletedRoom === undefined) return;
      // 現時点でチャットルームを表示しているユーザーに通知を送る
      this.server
        .to(String(deletedRoom.id))
        .emit('chat:deleteRoom', deletedRoom);

      // 全ユーザーのチャットルームを更新させる
      // NOTE: 本来削除されたルームに所属しているユーザーだけに送りたいが,
      //       それを判定するのが難しいためブロードキャストで送信している
      this.server.emit('chat:updateSideBarRooms');
    }
  }

  /**
   * 重複要素を除去した配列を返す関数
   */
  getChatroomDiff = (array1: Chatroom[], array2: Chatroom[]) => {
    // 引数の各々の配列から id のみの配列を生成
    const array1LabelArray = array1.map((itm) => {
      return itm.id;
    });
    const array2LabelArray = array2.map((itm) => {
      return itm.id;
    });
    // id のみの配列で比較
    const arr1 = [...new Set(array1LabelArray)];
    const arr2 = [...new Set(array2LabelArray)];

    return [...arr1, ...arr2].filter((val) => {
      return !arr1.includes(val) || !arr2.includes(val);
    });
  };

  /**
   * 入室可能な部屋の一覧を返す
   * @param userId
   */
  @SubscribeMessage('chat:getJoinableRooms')
  async onRoomJoinable(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ): Promise<any> {
    this.logger.log(`chat:getJoinableRooms received -> roomId: ${userId}`);

    // Private以外のチャットルームに絞る
    const notPrivate = {
      where: {
        type: {
          notIn: <ChatroomType>'PRIVATE',
        },
      },
    };

    // public, protectedのチャットルーム一覧を取得する
    const viewableRooms = await this.chatService.findAll(notPrivate);

    // userが所属しているチャットルームの一覧を取得する
    const joinedRooms = await this.chatService.findJoinedRooms(userId);

    const roomsDiff = this.getChatroomDiff(viewableRooms, joinedRooms);
    const viewableAndNotJoinedRooms = viewableRooms.filter((item) => {
      return roomsDiff.includes(item.id);
    });

    // フロントエンドへ送信し返す
    client.emit('chat:getJoinableRooms', viewableAndNotJoinedRooms);
  }
}
