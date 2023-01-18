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
import { DeleteChatroomMemberDto } from './dto/delete-chatroom-member.dto';
import { UpdateChatroomOwnerDto } from './dto/update-chatroom-owner.dto';
import { CreateBlockRelationDto } from './dto/create-block-relation.dto';
import { DeleteBlockRelationDto } from './dto/delete-block-relation.dto';
import { IsBlockedByUserIdDto } from './dto/is-blocked-by-user-id.dto';
import { OnGetRoomsDto } from './dto/on-get-rooms.dto';
import { ChangeCurrentRoomDto } from './dto/change-current-room.dto';
import { LeaveSocketDto } from './dto/leave-socket.dto';
import { OnRoomJoinableDto } from './dto/on-room-joinable.dto';
import { GetAdminsIdsDto } from './dto/get-admins-ids.dto';
import { GetMessagesCountDto } from './dto/get-messages-count.dto';
import type { ChatMessage } from './types/chat';

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
  ): Promise<string | undefined> {
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
        return 'You were banned.';
      }
      if (userInfo.status === ChatroomMembersStatus.MUTE) {
        return 'You were muted.';
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
          return 'You blocked this user.';
        } else {
          return 'This user blocked you.';
        }
      }
    }

    const res = await this.chatService.addMessage(createMessageDto);
    if (res === undefined) {
      return 'Failed to send message.';
    }
    const chatMessage: ChatMessage = {
      text: res.message,
      userName: createMessageDto.userName,
      createdAt: res.createdAt,
    };

    this.server
      .to(String(createMessageDto.chatroomId))
      .emit('chat:receiveMessage', chatMessage);

    return undefined;
  }

  /**
   * ソケットを引数で受けとったルームにjoinさせる
   * @param ChangeCurrentRoomDto
   * @return チャットルームに対応したメッセージを取得して返す
   */
  @SubscribeMessage('chat:changeCurrentRoom')
  async changeCurrentRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: ChangeCurrentRoomDto,
  ): Promise<void> {
    this.logger.log(`chat:changeCurrentRoom received -> ${dto.roomId}`);

    // index[0]には、socketのidが入っている
    // index[1]には、他のソケットと通信するようのルームがある
    if (client.rooms.size >= 3) {
      // roomに入っている場合は退出する
      const target = Array.from(client.rooms)[2];
      await client.leave(target);
    }
    await client.join(String(dto.roomId));
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
    await client.leave(String(dto.roomId));
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
    await this.leaveSocket(client, { roomId: dto.chatroomId });

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
    if (!member) {
      const deleteChatroomDto: DeleteChatroomDto = {
        id: dto.chatroomId,
        userId: dto.userId,
      };
      try {
        await this.chatService.deleteRoom(deleteChatroomDto);
      } catch (error) {
        this.logger.log('chat:leaveRoom', error);

        return false;
      }
    }

    return true;
  }

  /**
   * チャットルームを削除する
   * @param client
   * @param roomId
   */
  @SubscribeMessage('chat:deleteRoom')
  async onRoomDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: DeleteChatroomDto,
  ): Promise<boolean> {
    this.logger.log(`chat:deleteRoom received -> roomId: ${dto.id}`);
    const deletedRoom = await this.chatService.deleteRoom(dto);
    if (!deletedRoom) {
      return false;
    }
    // 現時点でチャットルームを表示しているユーザーに通知を送る
    this.server.to(String(deletedRoom.id)).emit('chat:deleteRoom', deletedRoom);

    // 全ユーザーのチャットルームを更新させる
    // NOTE: 本来削除されたルームに所属しているユーザーだけに送りたいが,
    //       それを判定するのが難しいためブロードキャストで送信している
    this.server.emit('chat:updateSideBarRooms');

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
  ): Promise<any> {
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
   * @param GetAdminsIdsDto
   */
  @SubscribeMessage('chat:getAdminIds')
  async getAdminsIds(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: GetAdminsIdsDto,
  ): Promise<number[]> {
    this.logger.log(`chat:getAdmins received -> roomId: ${dto.roomId}`);

    const admins = await this.chatService.findAdmins(dto.roomId);
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
    @MessageBody() dto: createDirectMessageDto,
  ): Promise<boolean> {
    this.logger.log('chat:directMessage received');
    // TODO: 既にルームが存在する場合はそのルームに入室させる
    const res = await this.chatService.startDirectMessage(dto);

    if (res) {
      const rooms = await this.chatService.findJoinedRooms(dto.userId1);
      // フロントエンドへ送り返す
      client.emit('chat:getJoinedRooms', rooms);
    }

    return res ? true : false;
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

    try {
      await this.chatService.update({
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
    } catch (error) {
      this.logger.log('chat:changeRoomOwner', error);

      return false;
    }

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
    this.logger.log('chat:getMessagesCount', dto);

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
        .to('user' + String(dto.blockingUserId))
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
  @SubscribeMessage('chat:joinMyRoom')
  async joinMyRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: number,
  ): Promise<void> {
    this.logger.log('chat:joinMyRoom received', userId);

    // index[0]には、socketのidが入っている
    if (client.rooms.size === 1) {
      await client.join('user' + String(userId));
    }
  }
}
