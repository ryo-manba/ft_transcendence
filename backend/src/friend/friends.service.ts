import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FollowingUser } from './friends.type';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  /**
   * @param userId
   * @return 以下の情報をオブジェクトの配列で返す
   * - フォローしているユーザーのID
   * - フォローしているユーザーの名前
   */
  async findFollowingUsers(userId: number): Promise<FollowingUser[]> {
    const where = {
      followerId: userId,
    };
    const followingUsers = await this.prisma.friendRelation.findMany({
      where,
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
}
