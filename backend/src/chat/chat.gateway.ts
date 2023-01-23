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
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { DeleteChatroomDto } from './dto/delete-chatroom.dto';
import { JoinChatroomDto } from './dto/join-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { updatePasswordDto } from './dto/update-password.dto';
import { updateMemberStatusDto } from './dto/update-member-status.dto';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { CheckBanDto } from './dto/check-ban.dto';
import { DeleteChatroomMemberDto } from './dto/delete-chatroom-member.dto';
import { UpdateChatroomOwnerDto } from './dto/update-chatroom-owner.dto';
import { CreateBlockRelationDto } from './dto/create-block-relation.dto';
import { DeleteBlockRelationDto } from './dto/delete-block-relation.dto';
import { IsBlockedByUserIdDto } from './dto/is-blocked-by-user-id.dto';
import { OnGetRoomsDto } from './dto/on-get-rooms.dto';
import { LeaveSocketDto } from './dto/leave-socket.dto';
import { OnRoomJoinableDto } from './dto/on-room-joinable.dto';
import { IsAdminDto } from './dto/is-admin.dto';
import { GetMessagesCountDto } from './dto/get-messages-count.dto';
import { SocketJoinRoomDto } from './dto/socket-join-room.dto';
import type { ChatMessage, CurrentRoom } from './types/chat';

type ExcludeProperties = 'hashedPassword' | 'createdAt' | 'updatedAt';
type ClientChatroom = Omit<Chatroom, ExcludeProperties>;

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
    // やり取りを行うためにソケットの入室処理を行わせる
    socket.emit('chat:handleConnection');
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Disconnect: ${socket.id}`);
  }

  convertToClientChatroom(chatroom: Chatroom): ClientChatroom {
    const clientChatroom: ClientChatroom = (({
      hashedPassword, // eslint-disable-line @typescript-eslint/no-unused-vars
      createdAt, // eslint-disable-line @typescript-eslint/no-unused-vars
      updatedAt, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...rest
    }) => rest)(chatroom);

    return clientChatroom;
  }

  generateSocketUserRoomName = (userId: number) => {
    return 'user' + String(userId);
  };

  generateSocketChatRoomName = (roomId: number) => {
    return 'room' + String(roomId);
  };

  /**
   * チャットルームを作成する
   * 作成者はそのまま入室する
   * @param CreateChatroomDto
   */
  @SubscribeMessage('chat:createAndJoinRoom')
  async CreateAndJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateChatroomDto,
  ): Promise<{ createdRoom: ClientChatroom | undefined }> {
    this.logger.log(`chat:createAndJoinRoom: ${dto.name}`);

    // チャットルームを作成する
    const createdRoom = await this.chatService.createRoom(dto);
    if (!createdRoom) {
      return { createdRoom: undefined };
    }

    // 作成者をチャットルームに入室させる
    const joinChatroomDto: JoinChatroomDto = {
      userId: dto.ownerId,
      chatroomId: createdRoom.id,
      type: createdRoom.type,
      password: dto.password,
    };
    const res = await this.joinRoom(client, joinChatroomDto);
    if (!res) {
      return { createdRoom: undefined };
    }

    const clientChatroom = this.convertToClientChatroom(createdRoom);

    return { createdRoom: clientChatroom };
  }

  /**
   * 入室しているチャットルーム一覧を返す
   * @param OnGetRoomsDto
   */
  @SubscribeMessage('chat:getJoinedRooms')
  async onGetRooms(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: OnGetRoomsDto,
  ) {
    this.logger.log(`chat:getJoinedRooms: ${dto.userId}`);
    // ユーザーが入室しているチャットルームを取得する
    const rooms = await this.chatService.findJoinedRooms(dto.userId);

    const clientChatrooms = rooms.map((room) =>
      this.convertToClientChatroom(room),
    );
    // フロントエンドへ送り返す
    client.emit('chat:getJoinedRooms', clientChatrooms);
  }

  /**
   * メッセージを保存してチャットルーム全体に内容を送信する
   * @param Message
   */
  @SubscribeMessage('chat:sendMessage')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ): Promise<{ error: string | undefined }> {
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
      if (userInfo.status === ChatroomMembersStatus.BAN) {
        return { error: 'You were banned.' };
      }
      if (userInfo.status === ChatroomMembersStatus.MUTE) {
        return { error: 'You were muted.' };
      }
    }

    const chatroom = await this.prisma.chatroom.findUnique({
      where: {
        id: createMessageDto.chatroomId,
      },
      include: {
        members: true,
      },
    });
    // DMの場合はBlockしている or されていないことを確認する
    if (chatroom.type === ChatroomType.DM) {
      const membersId = chatroom.members.map((member) => member.userId);
      const where = [
        { blockingUserId: membersId[0], blockedByUserId: membersId[1] },
        { blockingUserId: membersId[1], blockedByUserId: membersId[0] },
      ];
      const blockRelations = await this.prisma.blockRelation.findMany({
        where: {
          OR: [...where],
        },
      });
      if (blockRelations.length > 0) {
        if (blockRelations[0].blockedByUserId === createMessageDto.userId) {
          return { error: 'You blocked this user.' };
        } else {
          return { error: 'This user blocked you.' };
        }
      }
    }

    const message = await this.chatService.addMessage(createMessageDto);
    if (message === undefined) {
      return { error: 'Failed to send message.' };
    }
    const chatMessage: ChatMessage = {
      roomId: message.chatroomId,
      text: message.message,
      userName: createMessageDto.userName,
      createdAt: message.createdAt,
    };

    this.server
      .to(this.generateSocketChatRoomName(message.chatroomId))
      .emit('chat:receiveMessage', chatMessage);

    return { error: undefined };
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
    if (!userInfo) {
      return false;
    }
    const isBanned = userInfo.status === ChatroomMembersStatus.BAN;

    return isBanned;
  }

  /**
   * チャットルームに招待する
   * @param client
   * @param userId
   */
  @SubscribeMessage('chat:joinRoomFromOtherUser')
  async joinRoomFromOtherUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinChatroomDto,
  ): Promise<boolean> {
    this.logger.log(`chat:joinRoomFromOtherUser received -> ${dto.userId}`);

    const joinedRoom = await this.joinRoom(undefined, dto);
    if (joinedRoom === undefined) {
      return false;
    }

    // 入室させたユーザーに通知を送る（オンラインだった場合は、socket.joinを実行させる）
    this.server
      .to(this.generateSocketUserRoomName(dto.userId))
      .emit('chat:joinRoomFromOtherUser', joinedRoom);

    return true;
  }

  /**
   * ソケットをルームにjoinする
   * @param client
   * @param roomId
   */
  @SubscribeMessage('chat:socketJoinRoom')
  async socketJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SocketJoinRoomDto,
  ): Promise<boolean> {
    this.logger.log(`chat:socketJoinRoom received -> ${dto.roomId}`);
    await client.join(this.generateSocketChatRoomName(dto.roomId));

    // 戻り値がないとCallbackが反応しないためtrueを返してる
    return true;
  }

  /**
   * チャットルームに入室する
   * @param client
   * @param JoinChatroomDto
   */
  @SubscribeMessage('chat:joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket | undefined,
    @MessageBody() dto: JoinChatroomDto,
  ): Promise<{ joinedRoom: ClientChatroom | undefined }> {
    this.logger.log(`chat:joinRoom received -> ${dto.userId}`);
    const joinedRoom = await this.chatService.joinRoom(dto);
    if (!joinedRoom) {
      return { joinedRoom: undefined };
    }
    if (client) {
      const socketRoomName = this.generateSocketChatRoomName(joinedRoom.id);
      // 他の人を入室させるときはjoinできない
      await client.join(socketRoomName);
    }

    const clientJoinedRoom = this.convertToClientChatroom(joinedRoom);

    return { joinedRoom: clientJoinedRoom };
  }

  /**
   * ルームからソケットを退出させる
   * @param client
   * @param LeaveSocketDto
   */
  @SubscribeMessage('chat:leaveSocket')
  async leaveSocket(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: LeaveSocketDto,
  ): Promise<void> {
    this.logger.log(`chat:leaveSocket received -> ${dto.roomId}`);
    const socketRoomName = this.generateSocketChatRoomName(dto.roomId);
    await client.leave(socketRoomName);
  }

  /**
   * チャットルームを削除する
   * @param client
   * @param DeleteChatroomDto
   */
  @SubscribeMessage('chat:deleteRoom')
  async deleteRoom(@MessageBody() dto: DeleteChatroomDto): Promise<boolean> {
    this.logger.log(`chat:deleteRoom received -> roomId: ${dto.id}`);
    const deletedRoom = await this.chatService.deleteRoom(dto);
    if (!deletedRoom) {
      return false;
    }

    const socketRoomName = this.generateSocketChatRoomName(deletedRoom.id);

    const deletedClientRoom = this.convertToClientChatroom(deletedRoom);
    this.server.to(socketRoomName).emit('chat:deleteRoom', deletedClientRoom);

    // 入室者をルームから退出させる
    this.server.socketsLeave(socketRoomName);

    return true;
  }

  /**
   * 退出処理を行う
   * @param client
   * @param DeleteChatroomMemberDto
   */
  @SubscribeMessage('chat:leaveRoom')
  async onRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteChatroomMemberDto,
  ): Promise<boolean> {
    this.logger.log(`chat:leaveRoom received userId -> ${dto.userId}`);

    const deletedMember = await this.chatService.removeChatroomMember(dto);
    if (!deletedMember) {
      return false;
    }
    await this.leaveSocket(client, {
      roomId: dto.chatroomId,
    });

    // チャットルームを抜けたことで入室者がいなくなる場合は削除する
    // BAN or MUTEのユーザーは無視する
    const member = await this.prisma.chatroomMembers.findFirst({
      where: {
        AND: {
          chatroomId: dto.chatroomId,
          status: ChatroomMembersStatus.NORMAL,
        },
      },
    });

    const memberExists = !!member;
    if (memberExists) {
      return true;
    }
    const deleteChatroomDto: DeleteChatroomDto = {
      id: dto.chatroomId,
      userId: dto.userId,
    };

    const deletedRoom = await this.deleteRoom(deleteChatroomDto);
    if (!deletedRoom) {
      this.logger.log('chat:leaveRoom failed to delete room');

      return false;
    }

    return true;
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
   * @param OnRoomJoinableDto
   */
  @SubscribeMessage('chat:getJoinableRooms')
  async onRoomJoinable(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: OnRoomJoinableDto,
  ): Promise<ClientChatroom[]> {
    this.logger.log(`chat:getJoinableRooms received -> roomId: ${dto.userId}`);

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
    const joinedRooms = await this.chatService.findJoinedRooms(dto.userId);

    const roomsDiff = this.getChatroomDiff(viewableRooms, joinedRooms);
    const viewableAndNotJoinedRooms = viewableRooms.filter((item) => {
      return roomsDiff.includes(item.id);
    });

    const clientJoinableRoom = viewableAndNotJoinedRooms.map((room) =>
      this.convertToClientChatroom(room),
    );

    return clientJoinableRoom;
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

    const createdAdmin = await this.chatService.createAdmin(dto);
    if (!createdAdmin) {
      return false;
    }

    this.server
      .to(this.generateSocketUserRoomName(createdAdmin.userId))
      .emit('chat:addAdmin');

    return true;
  }

  /**
   * ユーザーがadminかどうかを判定する
   * @param isAdminDto
   */
  @SubscribeMessage('chat:isAdmin')
  async isAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: IsAdminDto,
  ): Promise<boolean> {
    this.logger.log(`chat:getAdmins received -> roomId: ${dto.chatroomId}`);

    const res = await this.prisma.chatroomAdmin.findUnique({
      where: {
        chatroomId_userId: {
          ...dto,
        },
      },
    });

    return !!res;
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
    const updatedMemberStatus = await this.chatService.updateMemberStatus(dto);

    if (updatedMemberStatus) {
      this.server
        .to(this.generateSocketUserRoomName(dto.userId))
        .emit('chat:banned');
    }

    return updatedMemberStatus ? true : false;
  }

  /**
   * ユーザーをUNBANする
   * @param updateMemberStatusDto
   */
  @SubscribeMessage('chat:unbanUser')
  async unbanUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: updateMemberStatusDto,
  ): Promise<boolean> {
    this.logger.log(`chat:unbanUser received -> roomId: ${dto.chatroomId}`);
    const res = await this.chatService.updateMemberStatus(dto);

    return res ? true : false;
  }

  /**
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
   * ユーザーをUNMUTEする
   * @param updateChatMemberStatusDto
   */
  @SubscribeMessage('chat:unmuteUser')
  async unmuteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: updateMemberStatusDto,
  ): Promise<boolean> {
    this.logger.log(`chat:unmuteUser received -> roomId: ${dto.chatroomId}`);
    const res = await this.chatService.updateMemberStatus(dto);

    return res ? true : false;
  }

  /*
   * ダイレクトメッセージを始める
   * - チャットルーム作成
   * - 自分と相手をチャットルームに追加する
   * @param createDirectMessageDto
   */
  @SubscribeMessage('chat:directMessage')
  async startDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateDirectMessageDto,
  ): Promise<{ currentRoom: CurrentRoom | undefined }> {
    this.logger.log('chat:directMessage received');
    const directMessage = await this.chatService.startDirectMessage(dto);

    if (directMessage) {
      const rooms = await this.chatService.findJoinedRooms(dto.userId1);
      // フロントエンドへ送り返す
      client.emit('chat:getJoinedRooms', rooms);
      const currentRoom: CurrentRoom = {
        id: directMessage.id,
        name: directMessage.name,
      };

      return { currentRoom };
    } else {
      return { currentRoom: undefined };
    }
  }

  /**
   * チャットルームのオーナーを切り替える
   * @param UpdateChatroomOwnerDto
   */
  @SubscribeMessage('chat:changeRoomOwner')
  async changeRoomOwner(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: UpdateChatroomOwnerDto,
  ): Promise<boolean> {
    this.logger.log('chat:changeRoomOwner received');

    const changedRoom = await this.chatService.updateRoom({
      data: {
        owner: {
          connect: {
            id: dto.ownerId,
          },
        },
      },
      where: {
        id: dto.chatroomId,
      },
    });
    if (!changedRoom) {
      this.logger.log('chat:changeRoomOwner failed');

      return false;
    }

    // NOTE: オーナーになったユーザー以外にも伝えることで不整合を避ける
    this.server
      .to(this.generateSocketChatRoomName(changedRoom.id))
      .emit('chat:changeRoomOwner', changedRoom);

    return true;
  }

  /**
   * チャットルームのメッセージの合計値を返す
   * @param GetMessagesCountDto
   */
  @SubscribeMessage('chat:getMessagesCount')
  async getMessagesCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: GetMessagesCountDto,
  ): Promise<number> {
    this.logger.log('chat:getMessagesCount', dto.chatroomId);

    // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#count
    const count = await this.prisma.message.count({
      where: {
        chatroomId: dto.chatroomId,
      },
    });

    this.logger.log('chat:getMessagesCount', count);

    return count;
  }

  /*
   * ユーザーをブロックする
   * @param CreateBlockRelationDto
   */
  @SubscribeMessage('chat:blockUser')
  async blockUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateBlockRelationDto,
  ): Promise<boolean> {
    this.logger.log('chat:blockUser received', dto);

    const res = await this.chatService.blockUser(dto);

    if (res) {
      // ブロックされたユーザーのフレンド一覧から
      // ブロックしたユーザーの表示を消すために通知を送る
      this.server
        .to(this.generateSocketUserRoomName(dto.blockingUserId))
        .emit('chat:blocked', dto.blockedByUserId);
    }

    return !!res;
  }

  /*
   * ユーザーのブロックを解除する
   * @param CreateBlockRelationDto
   */
  @SubscribeMessage('chat:unblockUser')
  async unblockUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteBlockRelationDto,
  ): Promise<boolean> {
    this.logger.log('chat:unblockUser received', dto);

    const res = await this.chatService.unblockUser(dto);

    return !!res;
  }

  /**
   * ユーザーがブロックされているかを確認する
   * @param IsBlockedByUserIdDto
   */
  @SubscribeMessage('chat:isBlockedByUserId')
  async isBlockedByUserId(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: IsBlockedByUserIdDto,
  ): Promise<boolean> {
    this.logger.log('chat:isBlockedByUserId received', dto);

    const res = await this.prisma.blockRelation.findUnique({
      where: {
        blockingUserId_blockedByUserId: {
          ...dto,
        },
      },
    });

    return !!res;
  }

  /**
   * 他のソケットと通信するようのルームに入室する
   * @param userId
   */
  @SubscribeMessage('chat:initSocket')
  async joinMyRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ): Promise<void> {
    this.logger.log('chat:initSocket received -> userId:', userId);

    // 自分単体に通知するようのルームに入室する
    const userRoomName = this.generateSocketUserRoomName(userId);
    await client.join(userRoomName);

    // すでに入室中のチャットルームも通知を受け取れるようにする
    const rooms = await this.chatService.findJoinedRooms(userId);
    rooms.map(async (room) => {
      await client.join(this.generateSocketChatRoomName(room.id));
    });
  }
}
