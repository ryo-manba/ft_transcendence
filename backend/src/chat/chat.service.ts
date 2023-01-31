import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message } from '@prisma/client';
import type { ChatMessage } from './types/chat';
import { CreateMessageDto } from './dto/message/create-message.dto';
import { GetMessagesDto } from './dto//message/get-messages.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('ChatService');

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
        userId: message.userId,
        userName: message.user.name,
        createdAt: message.createdAt,
      };
    });

    return chatMessages;
  }
}
