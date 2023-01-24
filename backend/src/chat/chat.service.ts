import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  Chatroom,
  ChatroomAdmin,
  ChatroomType,
  ChatroomMembers,
  Message,
  Prisma,
  ChatroomMembersStatus,
  BlockRelation,
  MuteRelation,
  BanRelation,
} from '@prisma/client';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JoinChatroomDto } from './dto/join-chatroom.dto';
import type { ChatUser, ChatMessage } from './types/chat';
import { updatePasswordDto } from './dto/update-password.dto';
import { updateMemberStatusDto } from './dto/update-member-status.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { DeleteChatroomDto } from './dto/delete-chatroom.dto';
import { DeleteChatroomMemberDto } from './dto/delete-chatroom-member.dto';
import { CreateBlockRelationDto } from './dto/create-block-relation.dto';
import { DeleteBlockRelationDto } from './dto/delete-block-relation.dto';
import { GetUnblockedUsersDto } from './dto/get-unblocked-users.dto';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { CreateMuteRelationDto } from './dto/create-mute-relation.dto';
import { MuteUserDto } from './dto/mute-user.dto';
import { CreateBanRelationDto } from './dto/create-ban-relation.dto';
import { BanUserDto } from './dto/ban-user.dto';

// 2の12乗回の演算が必要という意味
const saltRounds = 12;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('ChatService');

  async findOne(
    chatroomWhereUniqueInput: Prisma.ChatroomWhereUniqueInput,
  ): Promise<Chatroom | null> {
    return this.prisma.chatroom.findUnique({
      where: chatroomWhereUniqueInput,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ChatroomWhereUniqueInput;
    where?: Prisma.ChatroomWhereInput;
    orderBy?: Prisma.ChatroomOrderByWithRelationInput;
  }): Promise<Chatroom[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.chatroom.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createRoom(dto: CreateChatroomDto): Promise<Chatroom> {
    // Protectedの場合はパスワードをハッシュ化する
    const hashed =
      dto.type === ChatroomType.PROTECTED
        ? await bcrypt.hash(dto.password, saltRounds)
        : undefined;

    try {
      const chatroom = await this.prisma.chatroom.create({
        data: {
          name: dto.name,
          type: dto.type,
          ownerId: dto.ownerId,
          hashedPassword: hashed,
        },
      });

      // 成功したチャットルームの情報を返す
      return chatroom;
    } catch (error) {
      this.logger.log('createRoom', error);

      return undefined;
    }
  }

  async updateRoom(params: {
    where: Prisma.ChatroomWhereUniqueInput;
    data: Prisma.ChatroomUpdateInput;
  }): Promise<Chatroom> {
    const { where, data } = params;

    try {
      const updatedRoom = this.prisma.chatroom.update({
        data,
        where,
      });

      return updatedRoom;
    } catch (error) {
      this.logger.log('updateRoom', error);

      return undefined;
    }
  }

  async remove(where: Prisma.ChatroomWhereUniqueInput): Promise<Chatroom> {
    return this.prisma.chatroom.delete({
      where,
    });
  }

  async deleteRoom(dto: DeleteChatroomDto): Promise<Chatroom> {
    const whereInput = { id: dto.id };
    const room = await this.findOne(whereInput);
    if (room === undefined) {
      return undefined;
    }
    // DM以外の場合はオーナーのみ削除可能
    if (room.type !== ChatroomType.DM && room.ownerId !== dto.userId) {
      return undefined;
    }

    // DMの場合はAdminのみ削除できる(所属しているユーザー)
    if (room.type === ChatroomType.DM) {
      const isAdmin = await this.prisma.chatroomAdmin.findUnique({
        where: {
          chatroomId_userId: {
            chatroomId: dto.id,
            userId: dto.userId,
          },
        },
      });
      if (isAdmin === undefined) {
        return undefined;
      }
    }
    try {
      return await this.remove(whereInput);
    } catch (error) {
      this.logger.log('deleteRoom', error);

      return undefined;
    }
  }

  async addMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    try {
      const message = await this.prisma.message.create({
        data: {
          userId: createMessageDto.userId,
          chatroomId: createMessageDto.chatroomId,
          message: createMessageDto.message,
        },
      });

      return message;
    } catch (error) {
      this.logger.log('addMessage', error);

      return undefined;
    }
  }

  /**
   * chatroomのメンバーを削除する
   */
  async removeChatroomMember(
    dto: DeleteChatroomMemberDto,
  ): Promise<ChatroomMembers> {
    this.logger.log('removeChatroomMember', dto);

    try {
      const deletedMember = await this.prisma.chatroomMembers.delete({
        where: {
          chatroomId_userId: {
            ...dto,
          },
        },
      });

      return deletedMember;
    } catch (error) {
      this.logger.log('removeChatroomMember', error);

      return undefined;
    }
  }

  /**
   * chatroomに紐づいたメッセージを取得する
   * @param GetMessagesDto
   */
  async findChatMessages(dto: GetMessagesDto): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        chatroomId: dto.chatroomId,
      },
      skip: dto.pageSize * dto.skip,
      take: dto.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const chatMessages = messages.map((message) => {
      return {
        roomId: message.chatroomId,
        text: message.message,
        userName: message.user.name,
        createdAt: message.createdAt,
      };
    });

    return chatMessages;
  }

  async findAdmins(id: number): Promise<ChatroomAdmin[] | null> {
    const res = await this.prisma.chatroomAdmin.findMany({
      where: {
        chatroomId: id,
      },
    });

    return res;
  }

  /**
   * ユーザーが入室しているチャットルームの一覧を返す
   * @param id
   */
  async findJoinedRooms(userId: number): Promise<Chatroom[] | null> {
    // チャットルームメンバーからuserIdが含まれているものを取得する
    const joinedRoomInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        userId: userId,
      },
      include: {
        chatroom: true,
      },
    });

    // ユーザーが所属しているチャットルームのみ返す
    const joinedRoom = joinedRoomInfo.map((room) => room.chatroom);

    return joinedRoom;
  }

  /**
   * 入室しているユーザーの情報を返す
   * - ユーザーがMUTE or BANされている場合は期間を確認する
   * - 期間を越えている場合は、ステータスをNORMALに戻す
   * @param ChatroomMembersWhereUniqueInput
   */
  async findJoinedUserInfo(
    chatroomMembersWhereUniqueInput: Prisma.ChatroomMembersWhereUniqueInput,
  ): Promise<ChatroomMembers | null> {
    // チャットルームメンバーからuserIdが含まれているものを取得する
    const userInfo = await this.prisma.chatroomMembers.findUnique({
      where: chatroomMembersWhereUniqueInput,
    });

    // TODO: 置き換える
    // NORMAL以外の場合は期間が過ぎていないかを確認する
    if (userInfo.status !== ChatroomMembersStatus.NORMAL) {
      const startAt = userInfo.startAt?.getTime();
      const endAt = userInfo.endAt?.getTime();
      const now = Date.now();

      // 期間内ではなかった場合NORMALに更新する
      if (!(startAt <= now && now <= endAt)) {
        const dto: updateMemberStatusDto = {
          userId: userInfo.userId,
          chatroomId: userInfo.chatroomId,
          status: ChatroomMembersStatus.NORMAL,
        };

        return await this.updateMemberStatus(dto);
      }
    }

    return userInfo;
  }

  /**
   * チャットルームに入室する
   * @param id
   * @return 入室したチャットルームを返す
   */
  async joinRoom(dto: JoinChatroomDto): Promise<Chatroom | undefined> {
    // 入室するチャットルームを取得する
    const chatroom = await this.prisma.chatroom.findUnique({
      where: {
        id: dto.chatroomId,
      },
    });
    if (!chatroom) {
      return undefined;
    }

    if (dto.type === ChatroomType.PROTECTED) {
      // Protectedの場合はパスワードが正しいことを確認する
      const isValid = await bcrypt.compare(
        dto.password,
        chatroom.hashedPassword,
      );
      if (!isValid) {
        return undefined;
      }
    }

    // ユーザーをチャットルームに追加する
    try {
      await this.prisma.chatroomMembers.create({
        data: {
          userId: dto.userId,
          chatroomId: dto.chatroomId,
        },
      });
    } catch (error) {
      this.logger.log('joinRoom', error);

      return undefined;
    }

    // 入室したチャットルームを返す
    return chatroom;
  }

  /**
   * チャットルームに所属している かつ adminではない かつ BANもMUTEもされていないユーザ一覧を返す
   * @param roomId
   */
  async findCanSetAdminUsers(roomId: number): Promise<ChatUser[]> {
    const adminUsers = await this.findAdmins(roomId);

    // idの配列にする
    const adminUserIds = adminUsers.map((admin) => {
      return admin.userId;
    });

    // TODO: 置き換える
    // adminではない かつ statusがNORMAL
    const canSetAdminUsersInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          chatroomId: roomId,
          NOT: {
            userId: { in: adminUserIds },
          },
          status: ChatroomMembersStatus.NORMAL,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const canSetAdminUsers: ChatUser[] = canSetAdminUsersInfo.map((info) => {
      return info.user;
    });

    return canSetAdminUsers;
  }

  /**
   * チャットルームに所属している かつ BANされているユーザ一覧を返す
   * @param roomId
   */
  async findChatroomBannedUsers(roomId: number): Promise<ChatUser[]> {
    // TODO: 置き換える
    // ルームに所属している かつ statusがBAN以外のユーザーを取得する
    const bannedUsersInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          chatroomId: roomId,
          status: ChatroomMembersStatus.BAN,
        },
      },
      include: {
        user: true,
      },
    });

    // idと名前の配列にする
    const bannedUsers: ChatUser[] = bannedUsersInfo.map((info) => {
      return {
        id: info.user.id,
        name: info.user.name,
      };
    });

    return bannedUsers;
  }

  /**
   * チャットルームに所属している かつ BANされていない かつ adminではないユーザ一覧を返す
   * @param roomId
   */
  async findNotBannedUsers(roomId: number): Promise<ChatUser[]> {
    // TODO: 置き換える
    // ルームに所属している かつ statusがBAN以外のユーザーを取得する
    const notBannedUsersInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          chatroomId: roomId,
          status: {
            not: ChatroomMembersStatus.BAN,
          },
        },
      },
      include: {
        user: true,
      },
    });

    // idと名前の配列にする
    const notBannedUsers: ChatUser[] = notBannedUsersInfo.map((info) => {
      return {
        id: info.user.id,
        name: info.user.name,
      };
    });

    return notBannedUsers;
  }

  /**
   * 下記を満たすユーザ一覧を返す
   * - チャットルームに所属している
   * - statusがNORMAL
   * - adminではない
   * - オーナーではない
   * @param roomId
   */
  async findChatroomNormalUsers(roomId: number): Promise<ChatUser[]> {
    // adminを取得する
    const adminUsers = await this.findAdmins(roomId);
    const adminUserIds = adminUsers.map((admin) => admin.userId);

    // チャットルームのオーナーを取得する
    const chatroom = await this.findOne({
      id: roomId,
    });
    const ownerId = chatroom.ownerId;

    const adminAndOwnerIds = [...adminUserIds, ownerId];

    // TODO: 置き換える
    const normalUsersInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          chatroomId: roomId,
          status: ChatroomMembersStatus.NORMAL,
          NOT: {
            userId: { in: adminAndOwnerIds },
          },
        },
      },
      include: {
        user: true,
      },
    });

    // idと名前の配列にする
    const normalUsers: ChatUser[] = normalUsersInfo.map((info) => {
      return {
        id: info.user.id,
        name: info.user.name,
      };
    });

    return normalUsers;
  }

  /**
   * statusがNORMALなユーザ一覧を返す
   * @param roomId
   */
  async findChatroomActiveUsers(roomId: number): Promise<ChatUser[]> {
    // TODO: 置き換える
    const activeUsersInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          chatroomId: roomId,
          status: ChatroomMembersStatus.NORMAL,
        },
      },
      include: {
        user: true,
      },
    });

    const activeUsers: ChatUser[] = activeUsersInfo.map((info) => {
      return {
        id: info.user.id,
        name: info.user.name,
      };
    });

    return activeUsers;
  }

  /**
   * statusがMUTEなユーザ一覧を返す
   * @param roomId
   */
  async findMutedUsers(roomId: number): Promise<ChatUser[]> {
    // TODO: 置き換える
    const mutedUsersInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          chatroomId: roomId,
          status: ChatroomMembersStatus.MUTE,
        },
      },
      include: {
        user: true,
      },
    });

    const mutedUsers: ChatUser[] = mutedUsersInfo.map((info) => {
      return {
        id: info.user.id,
        name: info.user.name,
      };
    });

    return mutedUsers;
  }

  /**
   * チャットルームのadminを作成する
   * @param CreateAdminDto
   */
  async createAdmin(dto: CreateAdminDto): Promise<ChatroomAdmin> {
    try {
      const admin = await this.prisma.chatroomAdmin.create({
        data: {
          ...dto,
        },
      });

      return admin;
    } catch (error) {
      this.logger.log('createAdmin', error);

      return undefined;
    }
  }

  /**
   * チャットルームのパスワードを更新する
   * @param updatePasswordDto
   */
  async updatePassword(dto: updatePasswordDto): Promise<boolean> {
    const targetRoom = await this.findOne({
      id: dto.chatroomId,
    });
    if (!targetRoom) {
      return false;
    }

    // Oldパスワードが正しいことを確認する
    const isValid = await bcrypt.compare(
      dto.oldPassword,
      targetRoom.hashedPassword,
    );
    if (!isValid) {
      return false;
    }

    const hashed = await bcrypt.hash(dto.newPassword, saltRounds);

    const updatedRoom = await this.updateRoom({
      data: {
        hashedPassword: hashed,
      },
      where: {
        id: dto.chatroomId,
      },
    });

    if (!updatedRoom) {
      this.logger.log('updatePassword failed');

      return false;
    }

    return true;
  }

  /**
   * チャットルームに所属するユーザーのステータスを更新する
   * @param updateMemberStatusDto
   */
  async updateMemberStatus(
    dto: updateMemberStatusDto,
  ): Promise<ChatroomMembers> {
    // TODO: 置き換える
    // NOTE: とりあえずどちらも期間を1週間に設定している
    const BAN_TIME_IN_DAYS = 7;
    const MUTE_TIME_IN_DAYS = 7;

    const isNormal = dto.status === ChatroomMembersStatus.NORMAL;
    const startAt = isNormal ? null : new Date();
    let endAt = undefined;
    if (!isNormal) {
      endAt = new Date();
      const durationOfTheDay =
        dto.status === ChatroomMembersStatus.MUTE
          ? MUTE_TIME_IN_DAYS
          : BAN_TIME_IN_DAYS;

      endAt.setDate(startAt.getDate() + durationOfTheDay);
    }

    try {
      const member = await this.prisma.chatroomMembers.update({
        data: {
          status: dto.status,
          startAt: startAt,
          endAt: endAt,
        },
        where: {
          chatroomId_userId: {
            chatroomId: dto.chatroomId,
            userId: dto.userId,
          },
        },
      });

      return member;
    } catch (error) {
      this.logger.log('updateMemberStatus', error);

      return undefined;
    }
  }

  /**
   * 2つの配列を結合して、値の重複を取得する
   */
  getDuplicateIds(arr1: number[], arr2: number[]): number[] {
    const duplicateIds = new Set(
      [...arr1, ...arr2].filter(
        (id, index, self) => self.indexOf(id) !== index,
      ),
    );

    // Setから配列を作成して返す
    return [...duplicateIds];
  }

  /**
   * user1 と user2 が含まれているDMルームがすでに存在するかを確認する
   * 存在する場合、そのDMルームを返す
   * @return 既にある -> DMルーム
   * @return ない -> undefined
   */
  async findExistingDMRoom(
    userId1: number,
    userId2: number,
  ): Promise<Chatroom> {
    const DMRooms = await this.prisma.chatroom.findMany({
      where: {
        type: 'DM',
      },
    });
    const DMRoomIds = DMRooms.map((room) => {
      return room.id;
    });
    this.logger.log('DMRoomIds', DMRoomIds);

    // userが所属しているDMのルームのみ取得する
    const rooms1 = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          userId: userId1,
          chatroomId: { in: DMRoomIds },
        },
      },
    });
    const rooms2 = await this.prisma.chatroomMembers.findMany({
      where: {
        AND: {
          userId: userId2,
          chatroomId: { in: DMRoomIds },
        },
      },
    });

    const roomIds1 = rooms1.map((room) => {
      return room.chatroomId;
    });
    const roomIds2 = rooms2.map((room) => {
      return room.chatroomId;
    });
    const arr = this.getDuplicateIds(roomIds1, roomIds2);
    if (arr.length > 0) {
      this.logger.log('isCreatedDMRoom: already created');
      const existingDMRoom = await this.prisma.chatroom.findUnique({
        where: {
          id: arr[0],
        },
      });

      return existingDMRoom;
    }

    return undefined;
  }

  /**
   * DM用のChatroomを作成し、作られたChatroomを返す
   * @param createDirectMessageDto
   * @return 新規作成成功 or 既にある -> DMルーム
   * @return 作成失敗 -> undefined
   */
  async startDirectMessage(dto: CreateDirectMessageDto): Promise<Chatroom> {
    this.logger.log('startDirectMessage: ', dto);

    const existingDMRoom = await this.findExistingDMRoom(
      dto.userId1,
      dto.userId2,
    );
    this.logger.log('existingDMRoom: ', existingDMRoom);
    if (existingDMRoom) {
      return existingDMRoom;
    }

    // 共通するRoom一覧を取得する
    const roomName = dto.name1 + '_' + dto.name2;
    const createChatroomDto: CreateChatroomDto = {
      name: roomName,
      type: ChatroomType.DM,
      ownerId: dto.userId1,
    };
    try {
      // チャットルームを作成する
      const createdRoom = await this.createRoom(createChatroomDto);

      const joinChatroomDto1 = {
        userId: dto.userId1,
        chatroomId: createdRoom.id,
      };
      const joinChatroomDto2 = {
        userId: dto.userId2,
        chatroomId: createdRoom.id,
      };

      this.logger.log('members createMany', joinChatroomDto1, joinChatroomDto2);
      // 入室処理を行う
      await this.prisma.chatroomMembers.createMany({
        data: [joinChatroomDto1, joinChatroomDto2],
      });

      const createAdminDto1: CreateAdminDto = {
        userId: dto.userId1,
        chatroomId: createdRoom.id,
      };
      const createAdminDto2: CreateAdminDto = {
        userId: dto.userId2,
        chatroomId: createdRoom.id,
      };

      this.logger.log('admins createMany', createAdminDto1, createAdminDto2);
      // adminに追加する
      await this.prisma.chatroomAdmin.createMany({
        data: [createAdminDto1, createAdminDto2],
      });

      return createdRoom;
    } catch (error) {
      this.logger.log('startDirectMessage', error);

      return undefined;
    }
  }

  /**
   * BlockRelationにデータを作成する
   * @param CreateBlockRelationDto
   */
  async createBlockRelation(
    dto: CreateBlockRelationDto,
  ): Promise<BlockRelation> {
    this.logger.log('createBlockRelation: ', dto);
    try {
      const blockRelation = await this.prisma.blockRelation.create({
        data: {
          ...dto,
        },
      });

      return blockRelation;
    } catch (error) {
      this.logger.log('createBlockRelation: : ', error);

      return undefined;
    }
  }

  /**
   * 次のブロック処理を行う
   * - BlockUserRelationにデータを作成する
   * - ブロックしたユーザとのフレンド関係を削除する
   * @param CreateBlockUserDto
   */
  async blockUser(dto: CreateBlockRelationDto): Promise<BlockRelation> {
    this.logger.log('blockUser: ', dto);

    const blockRelation = await this.createBlockRelation(dto);
    if (!blockRelation) {
      return undefined;
    }

    // ブロックしたユーザとのフレンド関係を削除する
    const wheres = [
      { followerId: dto.blockedByUserId, followingId: dto.blockingUserId },
      { followerId: dto.blockingUserId, followingId: dto.blockedByUserId },
    ];
    try {
      await this.prisma.friendRelation.deleteMany({
        where: {
          OR: [...wheres],
        },
      });
    } catch (error) {
      this.logger.log('blockUser: ', error);
    }

    return blockRelation;
  }

  /**
   * ブロックを解除する
   * @param CreateBlockUserDto
   */
  async unblockUser(dto: DeleteBlockRelationDto): Promise<BlockRelation> {
    this.logger.log('unblockUser: ', dto);

    try {
      const blockRelation = await this.prisma.blockRelation.delete({
        where: {
          blockingUserId_blockedByUserId: {
            ...dto,
          },
        },
      });

      return blockRelation;
    } catch (error) {
      this.logger.log('unblockUser: ', error);

      return undefined;
    }
  }

  /**
   * ブロックされているユーザ一覧を返す
   * @param Prisma.BlockRelationWhereInput
   */
  async findBlockedUsers(
    where: Prisma.BlockRelationWhereInput,
  ): Promise<ChatUser[]> {
    this.logger.log('findBlockedUsers: ', where);

    const blockedUsers = await this.prisma.blockRelation.findMany({
      where: where,
      include: {
        blocking: true,
      },
    });

    const chatBlockedUsers: ChatUser[] = blockedUsers.map((user) => {
      return {
        id: user.blocking.id,
        name: user.blocking.name,
      };
    });

    return chatBlockedUsers;
  }

  /**
   * ブロックされていないユーザ一覧を返す
   * @param Prisma.BlockRelationWhereInput
   */
  async findUnblockedUsers(dto: GetUnblockedUsersDto): Promise<ChatUser[]> {
    this.logger.log('findUnlockedUsers: ', dto.blockedByUserId);

    const blockedUsers = await this.prisma.blockRelation.findMany({
      where: {
        blockedByUserId: dto.blockedByUserId,
      },
    });
    const blockingUserIds = blockedUsers.map((user) => user.blockingUserId);

    const unblockedUsers = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: dto.blockedByUserId } },
          { id: { notIn: blockingUserIds } },
        ],
      },
    });

    const chatUnblockedUsers: ChatUser[] = unblockedUsers.map((user) => {
      return {
        id: user.id,
        name: user.name,
      };
    });

    return chatUnblockedUsers;
  }

  /**
   * Muteリレーションを作成する
   * @param CreateMuteRelationDto
   */
  async createMuteRelation(dto: CreateMuteRelationDto): Promise<MuteRelation> {
    this.logger.log('createMuteRelation: ', dto);
    try {
      const muteRelation = await this.prisma.muteRelation.create({
        data: {
          ...dto,
        },
      });

      return muteRelation;
    } catch (error) {
      this.logger.log('createMuteRelation: ', error);

      return undefined;
    }
  }

  /**
   * ユーザーをミュートする
   * @param MuteUserDto
   */
  async muteUser(dto: MuteUserDto): Promise<boolean> {
    this.logger.log('muteUser: ', dto);

    const MUTE_TIME_IN_DAYS = 7;
    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(startAt.getDate() + MUTE_TIME_IN_DAYS);

    const createMuteRelationDto: CreateMuteRelationDto = {
      userId: dto.userId,
      chatroomId: dto.chatroomId,
      startAt: startAt,
      endAt: endAt,
    };

    const muteRelation = await this.createMuteRelation(createMuteRelationDto);

    return !!muteRelation;
  }

  /**
   * Banリレーションを作成する
   * @param CreateBanRelationDto
   */
  async createBanRelation(dto: CreateBanRelationDto): Promise<BanRelation> {
    this.logger.log('createBanRelation: ', dto);
    try {
      const banRelation = await this.prisma.banRelation.create({
        data: {
          ...dto,
        },
      });

      return banRelation;
    } catch (error) {
      this.logger.log('createBanRelation: ', error);

      return undefined;
    }
  }

  /**
   * ユーザーをBanする
   * @param BanUserDto
   */
  async banUser(dto: BanUserDto): Promise<boolean> {
    this.logger.log('banUser: ', dto);

    const BAN_TIME_IN_DAYS = 7;
    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(startAt.getDate() + BAN_TIME_IN_DAYS);

    const createBanRelationDto: CreateBanRelationDto = {
      userId: dto.userId,
      chatroomId: dto.chatroomId,
      startAt: startAt,
      endAt: endAt,
    };

    const banRelation = await this.createBanRelation(createBanRelationDto);

    return !!banRelation;
  }
}
