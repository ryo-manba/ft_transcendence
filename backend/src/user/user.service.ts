import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { UpdateUserEloDto } from './dto/update-user-elo.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
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

  async updateUserElo(
    userId: number,
    dto: UpdateUserEloDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        elo: { increment: dto.elo },
      },
    });
    delete user.hashedPassword;

    return user;
  }
}
