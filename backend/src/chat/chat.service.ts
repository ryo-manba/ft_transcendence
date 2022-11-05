import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ChatRoom, Message, Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async chatRoom(
    charRoomWhereUniqueInput: Prisma.ChatRoomWhereUniqueInput,
  ): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({
      where: charRoomWhereUniqueInput,
    });
  }

  async chatRooms(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ChatRoomWhereUniqueInput;
    where?: Prisma.ChatRoomWhereInput;
    orderBy?: Prisma.ChatRoomOrderByWithRelationInput;
  }): Promise<ChatRoom[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.chatRoom.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createChatRoom(data: Prisma.ChatRoomCreateInput): Promise<ChatRoom> {
    return this.prisma.chatRoom.create({
      data,
    });
  }

  async updateChatRoom(params: {
    where: Prisma.ChatRoomWhereUniqueInput;
    data: Prisma.ChatRoomUpdateInput;
  }): Promise<ChatRoom> {
    const { where, data } = params;

    return this.prisma.chatRoom.update({
      data,
      where,
    });
  }

  async deleteChatRoom(
    where: Prisma.ChatRoomWhereUniqueInput,
  ): Promise<ChatRoom> {
    return this.prisma.chatRoom.delete({
      where,
    });
  }

  /**
   * TODO: 引数をDTOにしたい
   */
  async addMessage(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  /**
   * chatroomに紐づいたメッセージを取得する
   * TODO: 引数に応じて取得する数を調整する
   */
  async findMessages(
    charRoomWhereUniqueInput: Prisma.ChatRoomWhereUniqueInput,
  ): Promise<Message[] | null> {
    const res = await this.prisma.chatRoom.findUnique({
      where: charRoomWhereUniqueInput,
      include: {
        message: true,
      },
    });

    return res.message;
  }
}
