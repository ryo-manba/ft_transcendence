import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  Prisma,
  Chatroom,
  ChatroomType,
  ChatroomMembers,
} from '@prisma/client';
import type { ChatUser } from './types/chat';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatroomDto } from './dto/chatroom/create-chatroom.dto';
import { JoinChatroomDto } from './dto/chatroom/join-chatroom.dto';
import { DeleteChatroomDto } from './dto/chatroom/delete-chatroom.dto';
import { UpdateChatroomPasswordDto } from './dto/chatroom/update-chatroom-password.dto';
import { DeleteChatroomMemberDto } from './dto/chatroom/delete-chatroom-member.dto';
import { DeleteChatroomPasswordDto } from './dto/chatroom/delete-chatroom-password.dto';

@Injectable()
export class ChatroomService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('ChatroomService');

  async encryptPassword(password: string): Promise<string> {
    // 2の12乗回の演算が必要という意味
    const SALT_ROUNDS = 12;

    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async findOne(
    chatroomWhereUniqueInput: Prisma.ChatroomWhereUniqueInput,
  ): Promise<Chatroom | null> {
    return await this.prisma.chatroom.findUnique({
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

    return await this.prisma.chatroom.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(dto: CreateChatroomDto): Promise<Chatroom> {
    // Protectedの場合はパスワードをハッシュ化する
    const hashed =
      dto.type === ChatroomType.PROTECTED
        ? await this.encryptPassword(dto.password)
        : undefined;

    try {
      const createdChatroom = await this.prisma.chatroom.create({
        data: {
          name: dto.name,
          type: dto.type,
          ownerId: dto.ownerId,
          hashedPassword: hashed,
        },
      });

      // 成功したチャットルームの情報を返す
      return createdChatroom;
    } catch (error) {
      this.logger.log('create', error);

      return undefined;
    }
  }

  async update(params: {
    where: Prisma.ChatroomWhereUniqueInput;
    data: Prisma.ChatroomUpdateInput;
  }): Promise<Chatroom> {
    const { where, data } = params;
    try {
      const updatedChatroom = await this.prisma.chatroom.update({
        where: where,
        data: data,
      });

      return updatedChatroom;
    } catch (error) {
      this.logger.log('update', error);

      return undefined;
    }
  }

  async delete(dto: DeleteChatroomDto): Promise<Chatroom> {
    const targetRoom = await this.findOne({ id: dto.id });
    if (!targetRoom) {
      return undefined;
    }
    // DM以外の場合はオーナーのみ削除可能
    if (
      targetRoom.type !== ChatroomType.DM &&
      targetRoom.ownerId !== dto.userId
    ) {
      return undefined;
    }

    // DMの場合は所属しているユーザーなら削除できる
    if (targetRoom.type === ChatroomType.DM) {
      const isMember = await this.prisma.chatroomMembers.findUnique({
        where: {
          chatroomId_userId: {
            chatroomId: dto.id,
            userId: dto.userId,
          },
        },
      });
      if (!isMember) {
        return undefined;
      }
    }

    try {
      const deletedChatroom = this.prisma.chatroom.delete({
        where: { id: dto.id },
      });

      return deletedChatroom;
    } catch (error) {
      this.logger.log('delete', error);

      return undefined;
    }
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
   * チャットルームに入室する
   * @param JoinChatroomDto
   * @return 入室したチャットルームを返す
   */
  async joinRoom(dto: JoinChatroomDto): Promise<Chatroom | undefined> {
    // 入室するチャットルームを取得する
    const chatroom = await this.findOne({
      id: dto.chatroomId,
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
   * チャットルームのパスワードを更新する
   * @param UpdateChatroomPasswordDto
   */
  async updatePassword(dto: UpdateChatroomPasswordDto): Promise<boolean> {
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

    const hashed = await this.encryptPassword(dto.newPassword);
    const updatedRoom = await this.update({
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
   * チャットルームのパスワードをする
   * @param UpdateChatroomPasswordDto
   */
  async deletePassword(dto: DeleteChatroomPasswordDto): Promise<Chatroom> {
    const targetRoom = await this.findOne({
      id: dto.chatroomId,
    });
    if (!targetRoom) {
      return undefined;
    }

    // Oldパスワードが正しいことを確認する
    const isValid = await bcrypt.compare(
      dto.oldPassword,
      targetRoom.hashedPassword,
    );
    if (!isValid) {
      return undefined;
    }

    const publicRoom = await this.update({
      data: {
        hashedPassword: undefined,
        type: ChatroomType.PUBLIC,
      },
      where: {
        id: dto.chatroomId,
      },
    });

    return publicRoom;
  }

  /**
   * ユーザーが入室しているチャットルームの一覧を返す
   * @param userId
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
   * 条件を満たすチャットルームメンバーをChatUserの形式で返す
   * @param
   */
  async findChatroomMembersAsChatUsers(params: {
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
    const DMRooms = await this.findAll({
      where: {
        type: 'DM',
      },
    });
    const DMRoomIds = DMRooms.map((room) => {
      return room.id;
    });

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
      const existingDMRoom = await this.findOne({
        id: arr[0],
      });

      return existingDMRoom;
    }

    return undefined;
  }

  /**
   * DM相手のユーザー名を返す
   * @param FindDMRecipientNameQueryDto
   */
  async findDMRecipientName(
    roomId: number,
    senderUserId: number,
  ): Promise<string> {
    this.logger.log(
      `findDMRecipientName: roomId >> ${roomId}, senderUserId >> ${senderUserId}`,
    );

    const dmRoomMembers = await this.prisma.chatroomMembers.findMany({
      where: {
        chatroomId: roomId,
      },
      include: {
        user: true,
      },
    });

    const dmRecipient = dmRoomMembers.find(
      (member) => member.user.id !== senderUserId,
    );

    return dmRecipient.user.name;
  }
}
