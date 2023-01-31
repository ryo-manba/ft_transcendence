import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ChatroomAdmin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IsAdminDto } from './dto/admin/is-admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private logger: Logger = new Logger('AdminService');

  async findOne(
    ChatroomAdminWhereUniqueInput: Prisma.ChatroomAdminWhereUniqueInput,
  ): Promise<ChatroomAdmin | null> {
    return await this.prisma.chatroomAdmin.findUnique({
      where: ChatroomAdminWhereUniqueInput,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ChatroomAdminWhereUniqueInput;
    where?: Prisma.ChatroomAdminWhereInput;
    orderBy?: Prisma.ChatroomAdminOrderByWithRelationInput;
  }): Promise<ChatroomAdmin[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return await this.prisma.chatroomAdmin.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async create(
    createArgs: Prisma.ChatroomAdminCreateArgs,
  ): Promise<ChatroomAdmin> {
    try {
      const createdChatroomAdmin = await this.prisma.chatroomAdmin.create({
        data: createArgs.data,
      });

      return createdChatroomAdmin;
    } catch (error) {
      this.logger.log('create', error);

      return undefined;
    }
  }

  async updateMany(params: {
    where: Prisma.ChatroomAdminWhereInput;
    data: Prisma.XOR<
      Prisma.ChatroomAdminUpdateManyMutationInput,
      Prisma.ChatroomAdminUncheckedUpdateManyInput
    >;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    try {
      const updatedChatroomAdminCount =
        await this.prisma.chatroomAdmin.updateMany({
          where: where,
          data: data,
        });

      return updatedChatroomAdminCount;
    } catch (error) {
      this.logger.log('updateMany', error);

      return undefined;
    }
  }

  async update(params: {
    where: Prisma.ChatroomAdminWhereUniqueInput;
    data: Prisma.ChatroomAdminUpdateInput;
  }): Promise<ChatroomAdmin> {
    const { where, data } = params;
    try {
      const updatedChatroomAdmin = await this.prisma.chatroomAdmin.update({
        where: where,
        data: data,
      });

      return updatedChatroomAdmin;
    } catch (error) {
      this.logger.log('update', error);

      return undefined;
    }
  }

  async delete(
    where: Prisma.ChatroomAdminWhereUniqueInput,
  ): Promise<ChatroomAdmin> {
    try {
      const deletedChatroomAdmin = await this.prisma.chatroomAdmin.delete({
        where,
      });

      return deletedChatroomAdmin;
    } catch (error) {
      this.logger.log('delete', error);

      return undefined;
    }
  }

  /**
   * Admin一覧を返す
   * @param chatroomId
   */
  async findAdmins(chatroomId: number): Promise<ChatroomAdmin[]> {
    const admins = await this.findAll({
      where: {
        chatroomId: chatroomId,
      },
    });

    return admins;
  }

  /**
   * Adminかどうかを判定する
   * @param IsAdminDto
   */
  async isAdmin(dto: IsAdminDto): Promise<boolean> {
    const admin = await this.findOne({
      chatroomId_userId: {
        ...dto,
      },
    });

    return !!admin;
  }
}
