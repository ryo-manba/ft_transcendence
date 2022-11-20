import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Chatroom, ChatroomAdmin, Message, Prisma } from '@prisma/client';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { CreateMessageDto } from './dto/create-message.dto';

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

  async create(CreateChatroomDto: CreateChatroomDto): Promise<Chatroom> {
    console.log(CreateChatroomDto);
    const chatroom = await this.prisma.chatroom.create({
      data: {
        ...CreateChatroomDto,
      },
    });

    return chatroom;
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

  // ユーザーが入室しているチャットルームの一覧を返す
  async findJoinedRooms(id: number): Promise<Chatroom[] | null> {
    // チャットルームメンバーからuserIdが含まれているものを取得する
    const joinedRoomInfo = await this.prisma.chatroomMembers.findMany({
      where: {
        userId: id,
      },
      include: {
        chatroom: true,
      },
    });

    // ユーザーが所属しているチャットルームのみ返す
    const joinedRoom = joinedRoomInfo.map((room) => room.chatroom);

    return joinedRoom;
  }
}
