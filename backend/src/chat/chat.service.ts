import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message } from '@prisma/client';
import type { ChatMessage } from './types/chat';
import { CreateMessageDto } from './dto/message/create-message.dto';
import { GetMessagesDto } from './dto//message/get-messages.dto';
import { BlockService } from './block.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockService: BlockService,
  ) {}

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
    const blockedUsers = await this.blockService.findBlockedUsers({
      blockedByUserId: dto.userId,
    });
    const blockedUserIds = blockedUsers.map((user) => user.id);

    const messages = await this.prisma.message.findMany({
      where: {
        chatroomId: dto.chatroomId,
        userId: {
          notIn: blockedUserIds,
        },
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
