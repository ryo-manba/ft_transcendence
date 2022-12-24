import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Chatroom, ChatroomType, ChatroomMembersStatus } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ChatService } from './chat.service';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { DeleteChatroomDto } from './dto/delete-chatroom.dto';
import { JoinChatroomDto } from './dto/join-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { updatePasswordDto } from './dto/update-password.dto';
import { updateMemberStatusDto } from './dto/update-member-status.dto';
import { createDirectMessageDto } from './dto/create-direct-message.dto';
import { CheckBanDto } from './dto/check-ban.dto';

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
  ): Promise<Chatroom> {
    this.logger.log(`chat:createRoom: ${dto.name}`);

    // 作成と入室を行う
    return await this.chatService.createAndJoinRoom(dto);
  }

  /**
   * 入室しているチャットルーム一覧を返す
   * @param userId
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
  ): Promise<boolean> {
    this.logger.log(
      `chat:sendMessage received -> ${createMessageDto.chatroomId}`,
    );

    // BAN or MUTEされていないことを確認する
    const userInfo = await this.chatService.findJoinedUserInfo({
      chatroomId_userId: {
        chatroomId: createMessageDto.chatroomId,
        userId: createMessageDto.userId,
      },
    });
    if (userInfo.status !== ChatroomMembersStatus.NORMAL) {
      return false;
    }

    const res = await this.chatService.addMessage(createMessageDto);
    if (res === undefined) {
      return false;
    }
    this.server
      .to(String(createMessageDto.chatroomId))
      .emit('chat:receiveMessage', createMessageDto);

    return true;
  }

  /**
   * ソケットを引数で受けとったルームにjoinさせる
   * @param roomID
   * @return チャットルームに対応したメッセージを取得して返す
   */
  @SubscribeMessage('chat:changeCurrentRoom')
  async onGetMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ): Promise<any> {
    this.logger.log(`chat:changeCurrentRoom received -> ${roomId}`);

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
    return messages;
  }

  /**
   * ユーザーがチャットルームからBANされているかをチェックする
   * @param CheckBanDto
   * @return BANされていたらtrueを返す
   */
  @SubscribeMessage('chat:isBannedUser')
  async isBannedUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CheckBanDto,
  ): Promise<boolean> {
    this.logger.log(`chat:isBannedUser received -> ${dto.userId}`);

    const data = {
      chatroomId_userId: {
        ...dto,
      },
    };
    const userInfo = await this.chatService.findJoinedUserInfo(data);

    return userInfo.status === ChatroomMembersStatus.BAN;
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

  /**
   * ユーザーをAdminに追加する
   * @param userId
   * @param roomId
   */
  @SubscribeMessage('chat:addAdmin')
  async addAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateAdminDto,
  ): Promise<boolean> {
    this.logger.log(`chat:addAdmin received -> roomId: ${dto.chatroomId}`);

    const res = await this.chatService.createAdmin(dto);

    return res !== undefined;
  }

  /**
   * チャットルームのadminId一覧を返す
   * @param roomId
   */
  @SubscribeMessage('chat:getAdminIds')
  async getAdminsIds(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ): Promise<number[]> {
    this.logger.log(`chat:getAdmins received -> roomId: ${roomId}`);

    const admins = await this.chatService.findAdmins(roomId);
    const res = admins.map((admin) => {
      return admin.userId;
    });

    return res;
  }

  /**
   * チャットルームのパスワードを更新する
   * @param updatePasswordDto
   */
  @SubscribeMessage('chat:updatePassword')
  async updatePassword(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: updatePasswordDto,
  ): Promise<boolean> {
    this.logger.log(
      `chat:updatePassword received -> roomId: ${dto.chatroomId}`,
    );

    return await this.chatService.updatePassword(dto);
  }

  /**
   * ユーザーをBANする
   * @param updateMemberStatusDto
   */
  @SubscribeMessage('chat:banUser')
  async banUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: updateMemberStatusDto,
  ): Promise<boolean> {
    this.logger.log(`chat:banUser received -> roomId: ${dto.chatroomId}`);
    const res = await this.chatService.updateMemberStatus(dto);

    return res ? true : false;
  }

  /*
   * ユーザーをMUTEする
   * @param updateChatMemberStatusDto
   */
  @SubscribeMessage('chat:muteUser')
  async muteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: updateMemberStatusDto,
  ): Promise<boolean> {
    this.logger.log(`chat:muteUser received -> roomId: ${dto.chatroomId}`);
    const res = await this.chatService.updateMemberStatus(dto);

    return res ? true : false;
  }

  /**
   * ダイレクトメッセージを始める
   * - チャットルーム作成
   * - 自分と相手をチャットルームに追加する
   * @param createDirectMessageDto
   */
  @SubscribeMessage('chat:directMessage')
  async startDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: createDirectMessageDto,
  ): Promise<boolean> {
    this.logger.log('chat:directMessage received');
    const res = await this.chatService.startDirectMessage(dto);

    return res ? true : false;
  }
}
