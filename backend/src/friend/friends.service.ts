import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

import type { FollowingUser } from './friends.type';

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  /**
   * @param userId
   * @return 以下の情報をオブジェクトの配列で返す
   * - フォローしているユーザーのID
   * - フォローしているユーザーの名前
   */
  async findFollowingUsers(userId: number): Promise<FollowingUser[]> {
    const followingUsers = await this.prisma.friendRelation.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: true,
      },
    });

    const res = followingUsers.map((user) => {
      return {
        id: user.followingId,
        name: user.following.name,
      };
    });

    return res;
  }

  /**
   * @param userId
   * @return 以下の情報をオブジェクトの配列で返す
   * - フォローしていないユーザーのID
   * - フォローしていないユーザーの名前
   */
  async findUnFollowingUsers(userId: number): Promise<FollowingUser[]> {
    // フォローしているユーザー一覧を取得する
    const followingUsers = await this.findFollowingUsers(userId);
    // idのみの配列に変換する
    const followingUserIds = followingUsers.map((user) => {
      return user.id;
    });
    // 自分自身を含めないために追加する
    followingUserIds.push(userId);

    // フォローしていないユーザーを取得する
    const unfollowingUsers = await this.userService.findAll({
      where: {
        NOT: {
          id: { in: followingUserIds },
        },
      },
    });

    // 名前とidのみに絞る(他のデータは不要なため)
    const res = unfollowingUsers.map((user) => {
      return {
        id: user.id,
        name: user.name,
      };
    });

    return res;
  }
}
