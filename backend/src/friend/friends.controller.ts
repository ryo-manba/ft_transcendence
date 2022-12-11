import {
  Req,
  Body,
  Post,
  Request,
  Query,
  Controller,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import type { Friend, Msg } from './types/friends';
import { CreateFriendDto } from './dto/create-friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * @param id (userId)
   * @return 以下の情報をオブジェクトの配列で返す
   * - フォローしているユーザーのID
   * - フォローしているユーザーの名前
   */
  @Get('followings')
  async findFollowingUsers(
    @Req() req: Request,
    @Query('id', ParseIntPipe) id: number,
  ): Promise<Friend[]> {
    return await this.friendsService.findFollowingUsers(id);
  }

  /**
   * @param id (userId)
   * @return 以下の情報をオブジェクトの配列で返す
   * - フォローしていないユーザーのID
   * - フォローしていないユーザーの名前
   */
  @Get('unfollowings')
  async findUnFollowingUsers(
    @Req() req: Request,
    @Query('id', ParseIntPipe) id: number,
  ): Promise<Friend[]> {
    return await this.friendsService.findUnFollowingUsers(id);
  }

  /**
   * @param userId
   * @param roomId
   * @return フォローしている かつ そのチャットルームに所属していないユーザーを返す
   */
  @Get('joinable')
  async joinableFriends(
    @Req() req: Request,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('roomId', ParseIntPipe) roomId: number,
  ): Promise<Friend[]> {
    return await this.friendsService.findJoinableFriends(userId, roomId);
  }

  /**
   * @param CreateFriendDto
   * @return 実行結果をmessageで返す
   */
  @Post('follow')
  async followUser(@Body() dto: CreateFriendDto): Promise<Msg> {
    return await this.friendsService.follow(dto);
  }
}
