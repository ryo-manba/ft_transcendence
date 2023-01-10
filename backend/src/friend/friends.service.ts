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
  async findUnfollowingUsers(userId: number): Promise<Friend[]> {
    // フォローしているユーザー一覧を取得する
    const followingUsers = await this.findFollowingUsers(userId);
    // idのみの配列に変換する
    const followingUserIds = followingUsers.map((user) => {
      return user.id;
    });

    // 全ユーザーの中からフォローしているユーザーと自分自身をを除いて取得する
    const unfollowingUsers = await this.userService.findAll({
      where: {
        AND: [
          {
            NOT: {
              id: { in: followingUserIds },
            },
          },
          {
            NOT: {
              id: userId,
            },
          },
        ],
      },
    });

    const userNameAndIdArray = unfollowingUsers.map((user) => {
      return {
        id: user.id,
        name: user.name,
      };
    });

    return userNameAndIdArray;
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
   * @param roomId
   * @return フォローしている かつ チャットルームに入室していないユーザー一覧を返す
   */
  async findJoinableFriends(userId: number, roomId: number): Promise<Friend[]> {
    const followingUsers = await this.findFollowingUsers(userId);

    // chatroomに所属してるUserIdを取得する
    const joinedUsers = await this.prisma.chatroomMembers.findMany({
      where: {
        chatroomId: roomId,
      },
      select: {
        userId: true,
      },
    });

    // idの配列に変更する
    const joinedUserIds = joinedUsers.map((user) => user.userId);

    // すでに入室しているユーザーを除去する
    const joinableFriends = followingUsers.filter(
      (user) => !joinedUserIds.includes(user.id),
    );

    return joinableFriends;
  }

  /**
   * @param userId
   * @return boolean
   * Friendリレーションを作成することでUserのフォロー処理を行う
   */
  async follow(dto: CreateFriendDto): Promise<Msg> {
    const where = [
      { blockedByUserId: dto.followerId, blockingUserId: dto.followingId },
      { blockedByUserId: dto.followingId, blockingUserId: dto.followerId },
    ];
    // TODO: ブロックされてたら友達追加できないようにする?
    const blockRelations = await this.prisma.blockRelation.findMany({
      where: {
        OR: [...where],
      },
    });

    if (blockRelations.length > 0) {
      // 自分がブロックしている場合
      if (blockRelations[0].blockedByUserId === dto.followerId) {
        return { message: 'You blocked this user.' };
      } else {
        return { message: 'This user blocked you.' };
      }
    }

    // フォロー処理を行う
    const res = await this.create(dto);
    if (res) {
      return { message: 'ok' };
    }

    return { message: 'Failed to follow user.' };
  }
}
