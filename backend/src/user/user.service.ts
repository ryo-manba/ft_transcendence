import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { User } from '@prisma/client';
import { UpdatePointDto } from './dto/update-point.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { createReadStream, unlink } from 'node:fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  static avatarImageDir = 'uploads/avatarImages';

  async findOne(userId: number): Promise<Omit<User, 'hashPassword'> | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    delete user.hashedPassword;

    return user;
  }

  async updateName(
    userId: number,
    dto: UpdateNameDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
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
  }

  async updatePoint(
    userId: number,
    dto: UpdatePointDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
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
  }

  getAvatarImage(imageUrl: string): StreamableFile {
    const filePath = path.join(
      process.cwd(),
      UserService.avatarImageDir,
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
      UserService.avatarImageDir,
      avatarPath,
    );
    unlink(filePath, (err) => {
      if (err) throw err;
      console.log(`${filePath} was deleted`);
    });
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatarPath: null,
      },
    });
    delete user.hashedPassword;

    return user;
  }

  async updateAvatar(
    userId: number,
    dto: UpdateAvatarDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
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
  }
}
