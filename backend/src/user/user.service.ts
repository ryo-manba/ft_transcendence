import { Injectable, StreamableFile, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { Prisma, User } from '@prisma/client';
import { UpdatePointDto } from './dto/update-point.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { createReadStream, unlink } from 'node:fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: number): Promise<Omit<User, 'hashPassword'> | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    delete user.hashedPassword;

    return user;
  }

  /**
   * @param params(userを探す条件)
   * @returns 条件を満たすユーザー一覧を返す
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ChatroomWhereUniqueInput;
    where?: Prisma.ChatroomWhereInput;
    orderBy?: Prisma.ChatroomOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async updateName(
    userId: number,
    dto: UpdateNameDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...dto,
        },
      });
      delete user.hashedPassword;

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

  async updatePoint(
    userId: number,
    dto: UpdatePointDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...dto,
        },
      });
      delete user.hashedPassword;

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  getAvatarImage(imageUrl: string): StreamableFile {
    const filePath = path.join(
      process.cwd(),
      process.env.AVATAR_IMAGE_DIR,
      imageUrl,
    );
    const file = createReadStream(filePath);

    // StreamableFileを使うと、バックエンドのローカルにある画像をフロントエンドに送れる
    return new StreamableFile(file);
  }

  async deleteAvatar(
    userId: number,
    avatarPath: string,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const filePath = path.join(
      process.cwd(),
      process.env.AVATAR_IMAGE_DIR,
      avatarPath,
    );
    unlink(filePath, (err) => {
      if (err) throw err;
      console.log(`${filePath} was deleted`);
    });

    return this.updateAvatar(userId, { avatarPath: null });
  }

  async updateAvatar(
    userId: number,
    dto: UpdateAvatarDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...dto,
        },
      });
      delete user.hashedPassword;

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
