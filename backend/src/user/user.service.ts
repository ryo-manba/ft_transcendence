import {
  Injectable,
  StreamableFile,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { Prisma, UserStatus } from '@prisma/client';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePointDto } from './dto/update-point.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { createReadStream, unlink } from 'node:fs';
import * as path from 'path';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';
import { LoginUser } from './types/user';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private logger: Logger = new Logger('UserService');

  async findOne(userId: number): Promise<LoginUser | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // userがnullのときにhashedPasswordにアクセスしようとするとエラーになる
    if (user !== null) {
      delete user.hashedPassword;
      delete user.secret2FA;
    }

    return user;
  }

  /**
   * @param params(userを探す条件)
   * @returns 条件を満たすユーザー一覧を返す
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<LoginUser[]> {
    const { skip, take, cursor, where, orderBy } = params;

    const users = await this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    if (users != null) {
      users.forEach(function (user) {
        delete user.hashedPassword;
        delete user.secret2FA;
      });
    }

    return users;
  }

  async updateName(dto: UpdateNameDto): Promise<LoginUser> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: dto.userId,
        },
        data: {
          name: dto.name,
        },
      });
      delete user.hashedPassword;
      delete user.secret2FA;

      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('username is already taken');
        }
      }
      throw error;
    }
  }

  async updatePoint(dto: UpdatePointDto): Promise<LoginUser> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: dto.userId,
        },
        data: {
          point: dto.point,
        },
      });
      delete user.hashedPassword;
      delete user.secret2FA;

      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAvatarImage(id: number): Promise<StreamableFile | undefined> {
    const user = await this.findOne(id);
    if (user === null || user.avatarPath === null) return undefined;
    const filePath = path.join(
      process.cwd(),
      process.env.AVATAR_IMAGE_DIR,
      user.avatarPath,
    );
    const file = createReadStream(filePath);

    // StreamableFileを使うと、バックエンドのローカルにある画像をフロントエンドに送れる
    return new StreamableFile(file);
  }

  async deleteAvatar(dto: DeleteAvatarDto): Promise<LoginUser> {
    const filePath = path.join(
      process.cwd(),
      process.env.AVATAR_IMAGE_DIR,
      dto.avatarPath,
    );
    unlink(filePath, (err) => {
      if (err) throw err;
      console.log(`${filePath} was deleted`);
    });

    const updateDto: UpdateAvatarDto = {
      userId: dto.userId,
      avatarPath: null,
    };

    return this.updateAvatar(updateDto);
  }

  async updateAvatar(dto: UpdateAvatarDto): Promise<LoginUser> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: dto.userId,
        },
        data: {
          avatarPath: dto.avatarPath,
        },
      });
      delete user.hashedPassword;
      delete user.secret2FA;

      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getStatus(id: number): Promise<UserStatus | undefined> {
    const user = await this.findOne(id);
    if (user === null) return undefined;

    return user.status;
  }

  async updateStatus(dto: UpdateStatusDto): Promise<LoginUser> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: dto.userId,
        },
        data: {
          status: dto.status,
        },
      });
      delete user.hashedPassword;
      delete user.secret2FA;

      return user;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }

  async getRanking(userId: number): Promise<number> {
    const sortedUsers = await this.prisma.user.findMany({
      orderBy: [{ point: 'desc' }, { createdAt: 'asc' }],
    });

    const userIndex = sortedUsers.findIndex((user) => user.id === userId);
    const ranking = userIndex + 1;

    return ranking;
  }
}
