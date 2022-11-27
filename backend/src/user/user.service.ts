import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { User } from '@prisma/client';
import { UpdatePointDto } from './dto/update-point.dto';
import { UpdateAvatarPathDto } from './dto/update-avatar-path.dto';

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

  async updateAvatarPath(
    userId: number,
    dto: UpdateAvatarPathDto,
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
