import { Body, Controller, Get } from '@nestjs/common';
import { FriendsService } from './friends.service';

type FollowingUser = {
  id: number;
  name: string;
};

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * @param userId
   * @return 以下の情報をオブジェクトの配列で返す
   * - フォローしているユーザーのID
   * - フォローしているユーザーの名前
   */
  @Get('followings')
  async findFollowingUsers(@Body() userId: number): Promise<FollowingUser[]> {
    return await this.friendsService.findFollowingUsers(userId);
  }
}
