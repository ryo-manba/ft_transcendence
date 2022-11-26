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
import { JoinChatroomDto } from './dto/join-chatroom.dto';

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
   * @return 入室に成功したかどうかを表すbooleanを返す
   */
  async joinRoom(dto: JoinChatroomDto): Promise<boolean> {
    console.log('joinRoom: ', dto);
    // TODO: ブロックされているユーザーは入れないようにする?
    if (dto.type === ChatroomType.PROTECTED) {
      const chatroom = await this.prisma.chatroom.findUnique({
        where: {
          id: dto.roomId,
        },
      });
      // Protectedの場合はパスワードが正しいことを確認する
      if (!chatroom) return false;
      const isValid = await bcrypt.compare(
        dto.password,
        chatroom.hashedPassword,
      );
      if (!isValid) return false;
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
      return false;
    }

    return true;
  }

  async createAndJoinRoom(dto: CreateChatroomDto): Promise<boolean> {
    // Chatroomを作成する
    const room = await this.create(dto);
    if (room === undefined) {
      return false;
    }

    // 作成できた場合、チャットルームに入室する
    const joinDto: JoinChatroomDto = {
      userId: dto.ownerId,
      type: dto.type,
      roomId: room.id,
      password: dto.password,
    };
    const isSuccess = await this.joinRoom(joinDto);

    return isSuccess;
  }
}
