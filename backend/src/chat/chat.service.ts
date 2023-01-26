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
  BlockRelation,
  MuteRelation,
} from '@prisma/client';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { DeleteAdminDto } from './dto/delete-admin.dto';
import { JoinChatroomDto } from './dto/join-chatroom.dto';
import type { ChatUser, ChatMessage } from './types/chat';
import { updatePasswordDto } from './dto/update-password.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { DeleteChatroomDto } from './dto/delete-chatroom.dto';
import { DeleteChatroomMemberDto } from './dto/delete-chatroom-member.dto';
import { CreateBlockRelationDto } from './dto/create-block-relation.dto';
import { DeleteBlockRelationDto } from './dto/delete-block-relation.dto';
import { GetUnblockedUsersDto } from './dto/get-unblocked-users.dto';
import { CreateMuteRelationDto } from './dto/create-mute-relation.dto';
import { MuteUserDto } from './dto/mute-user.dto';

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

    // DMの場合は所属しているユーザーなら削除できる
    if (room.type === ChatroomType.DM) {
      const isMember = await this.prisma.chatroomMembers.findUnique({
        where: {
          chatroomId_userId: {
            chatroomId: dto.id,
            userId: dto.userId,
          },
        },
      });
      if (isMember === undefined) {
        return undefined;
      }
    }

    try {
      const deletedRoom = this.prisma.chatroom.delete({
        where: whereInput,
      });

      return deletedRoom;
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

  /**
   * admin一覧を返す
   * @param chatroomId
   */
  async findAdmins(chatroomId: number): Promise<ChatroomAdmin[]> {
    const admins = await this.prisma.chatroomAdmin.findMany({
      where: {
        chatroomId: chatroomId,
      },
    });

    return admins;
  }

  /**
   * チャットルームのオーナーを返す
   * @param chatroomId
   */
  async findChatroomOwner(chatroomId: number): Promise<ChatUser> {
    const room = await this.prisma.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
      include: {
        owner: true,
      },
    });

    if (!room) {
      return undefined;
    }

    const owner = {
      id: room.owner.id,
      name: room.owner.name,
    };

    return owner;
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
   * 条件を満たすチャットルームメンバーをChatUserの形式で返す
   * @param
   */
  async findChatroomMembersToChatUsers(params: {
    where: Prisma.ChatroomMembersWhereInput;
  }): Promise<ChatUser[]> {
    const { where } = params;
    const members = await this.prisma.chatroomMembers.findMany({
      where: where,
      include: {
        user: true,
      },
    });

    const chatUsers: ChatUser[] = members.map((member) => {
      return {
        id: member.user.id,
        name: member.user.name,
      };
    });

    return chatUsers;
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
   * チャットルームのadminを削除する
   * @param CreateAdminDto
   */
  async deleteAdmin(dto: DeleteAdminDto): Promise<ChatroomAdmin> {
    try {
      const deletedAdmin = await this.prisma.chatroomAdmin.delete({
        where: {
          chatroomId_userId: {
            ...dto,
          },
        },
      });

      return deletedAdmin;
    } catch (error) {
      this.logger.log('deleteAdmin', error);

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
      this.logger.log('findExistingDMRoom: already created');
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
}
