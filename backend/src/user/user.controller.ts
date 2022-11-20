import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { UpdatePointDto } from './dto/update-point.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getLoginUser(@Req() req: Request): Omit<User, 'hashedPassword'> {
    // custom.d.ts で型変換してる
    return req.user;
  }

  @Patch(':id')
  updatePoint(
    @Param('id') id: string,
    @Body() dto: UpdatePointDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    return this.userService.updatePoint(Number(id), dto);
  }

  @Patch()
  updateUser(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    // for eslint
    interface RequestUser {
      id: number;
    }
    const req_user: RequestUser = req.user;

    return this.userService.updateUser(req_user.id, dto);
  }
}
