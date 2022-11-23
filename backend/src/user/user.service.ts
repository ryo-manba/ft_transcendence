import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { UpdatePointDto } from './dto/update-point.dto';

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

  async updateUser(
    userId: number,
    dto: UpdateUserDto,
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
}
