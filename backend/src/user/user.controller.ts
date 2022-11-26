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
import { UpdateNameDto } from './dto/update-name.dto';
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

  @Patch('point/:id')
  updatePoint(
    @Param('id') id: string,
    @Body() dto: UpdatePointDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    return this.userService.updatePoint(Number(id), dto);
  }

  @Patch('name/:id')
  updateName(
    @Param('id') id: string,
    @Body() dto: UpdateNameDto,
  ): Promise<Omit<User, 'hashedPassword'>> {
    return this.userService.updateName(Number(id), dto);
  }
}
