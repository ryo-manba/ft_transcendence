import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import type { Friend, Msg } from './types/friends';
import { CreateFriendDto } from './dto/create-friend.dto';
import { FriendRelation } from '@prisma/client';

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  private logger: Logger = new Logger('FriendService');

  /**
   * @param userId
   * @return 以下の情報をオブジェクトの配列で返す
   * - フォローしているユーザーのID
   * - フォローしているユーザーの名前
   */
  async findFollowingUsers(userId: number): Promise<Friend[]> {
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
  async findUnFollowingUsers(userId: number): Promise<Friend[]> {
    // フォローしているユーザー一覧を取得する
    const followingUsers = await this.findFollowingUsers(userId);
    // idのみの配列に変換する
    const followingUserIds = followingUsers.map((user) => {
      return user.id;
    });

    // 自分自身を含めないためにフォローしてるユーザーに追加する
    followingUserIds.push(userId);

    // 全ユーザーからフォローしているユーザーを除いて取得する
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

  /**
   * Friendリレーションを作成する
   * @param CreateFriendDto
   * @return 作成したFriendRelation
   */
  async create(dto: CreateFriendDto): Promise<FriendRelation> {
    try {
      const res = await this.prisma.friendRelation.create({
        data: {
          followerId: dto.followerId,
          followingId: dto.followingId,
        },
      });

      return res;
    } catch (error) {
      this.logger.log(error);

      return undefined;
    }
  }

  /**
   * @param userId
   * @return boolean
   * Friendリレーションを作成することでUserのフォロー処理を行う
   */
  async follow(dto: CreateFriendDto): Promise<Msg> {
    // TODO: ブロックされてたら友達追加できないようにする?

    // フォロー処理を行う
    const res = await this.create(dto);
    if (res) {
      return { message: 'ok' };
    }

    return { message: 'Error: can not followed' };
  }
}
