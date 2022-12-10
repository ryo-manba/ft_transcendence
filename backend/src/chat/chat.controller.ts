import { Query, Controller, Get, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { ChatUser } from './types/chat';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * @param roomId
   * @return 以下の情報をオブジェクトの配列で返す
   * - adminではないユーザーのID
   * - adminではないユーザーの名前
   */
  @Get('non-admin')
  async findNotAdminUsers(
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatUser[]> {
    return await this.chatService.findNotAdminUsers(roomId);
  }
}
