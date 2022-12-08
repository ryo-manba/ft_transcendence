import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import {
  Chatroom,
  ChatroomAdmin,
  ChatroomType,
  Message,
  Prisma,
} from '@prisma/client';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JoinChatroomDto } from './dto/join-chatroom.dto';
import type { ChatUser } from './types/chat';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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

  async create(dto: CreateChatroomDto): Promise<Chatroom> {
    // Protectedの場合はパスワードをハッシュ化する
    const hashed =
      dto.type === ChatroomType.PROTECTED
        ? await bcrypt.hash(dto.password, 12)
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
      return undefined;
    }
  }

  async update(params: {
    where: Prisma.ChatroomWhereUniqueInput;
    data: Prisma.ChatroomUpdateInput;
  }): Promise<Chatroom> {
    const { where, data } = params;

    return this.prisma.chatroom.update({
      data,
      where,
    });
  }

  async remove(where: Prisma.ChatroomWhereUniqueInput): Promise<Chatroom> {
    return this.prisma.chatroom.delete({
      where,
    });
  }

  async addMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    console.log(createMessageDto);

    const Message = await this.prisma.message.create({
      data: {
        ...createMessageDto,
      },
    });

    return Message;
  }

  /**
   * chatroomに紐づいたメッセージを取得する
   * TODO: 引数に応じて取得する数を調整する
   */
  async findMessages(
    chatroomWhereUniqueInput: Prisma.ChatroomWhereUniqueInput,
  ): Promise<Message[] | null> {
    const res = await this.prisma.chatroom.findUnique({
      where: chatroomWhereUniqueInput,
      include: {
        messages: true,
      },
    });

    return res.messages;
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
   * チャットルームに入室する
   * @param id
   * @return 入室したチャットルームを返す
   */
  async joinRoom(dto: JoinChatroomDto): Promise<Chatroom> {
    console.log('joinRoom: ', dto);
    // TODO: ブロックされているユーザーは入れないようにする?
    // 入室するチャットルームを取得する
    const chatroom = await this.prisma.chatroom.findUnique({
      where: {
        id: dto.roomId,
      },
    });
    if (!chatroom) return undefined;

    if (dto.type === ChatroomType.PROTECTED) {
      // Protectedの場合はパスワードが正しいことを確認する
      const isValid = await bcrypt.compare(
        dto.password,
        chatroom.hashedPassword,
      );
      if (!isValid) return undefined;
    }

    // 入室処理を行う
    try {
      await this.prisma.chatroomMembers.create({
        data: {
          userId: dto.userId,
          chatroomId: dto.roomId,
        },
      });
    } catch (error) {
      // userId or chatroomIdが正しくない場合は失敗する
      return undefined;
    }

    // 入室したチャットルームを返す
    return chatroom;
  }

  async createAndJoinRoom(dto: CreateChatroomDto): Promise<Chatroom> {
    // Chatroomを作成する
    const createdRoom = await this.create(dto);
    if (createdRoom === undefined) {
      return undefined;
    }

    // 作成できた場合、チャットルームに入室する
    const joinDto: JoinChatroomDto = {
      userId: dto.ownerId,
      type: dto.type,
      roomId: createdRoom.id,
      password: dto.password,
    };
    const isSuccess = await this.joinRoom(joinDto);

    // 入室できたら作成したチャットルームの情報を返す
    return isSuccess ? createdRoom : undefined;
  }

  /**
   * 所属している かつ adminではないユーザ一覧を返す
   * @param userId
   * @param roomId
   */
  async findNotAdminUsers(roomId: number): Promise<ChatUser[]> {
    // ルームに所属しているユーザー一覧を取得する
    const joinedUsersInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        chatroomId: roomId,
      },
      include: {
        user: true,
      },
    });

    // ルームのadmin一覧を取得する
    const adminUsers = await this.prisma.chatroomAdmin.findMany({
      where: {
        chatroomId: roomId,
      },
    });

    // idの配列にする
    const adminUserIds = adminUsers.map((admin) => {
      return admin.userId;
    });

    // adminのユーザー除去する
    const notAdminUsersInfo = joinedUsersInfo.filter(
      (info) => !adminUserIds.includes(info.user.id),
    );

    // idと名前の配列にする
    const notAdminUsers: ChatUser[] = notAdminUsersInfo.map((info) => {
      return {
        id: info.user.id,
        name: info.user.name,
      };
    });

    return notAdminUsers;
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
      return undefined;
    }
  }
}
