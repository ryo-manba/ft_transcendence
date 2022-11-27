import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { User } from '@prisma/client';
import { UpdatePointDto } from './dto/update-point.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { createReadStream } from 'fs';

const storage = {
  storage: diskStorage({
    destination: './uploads/avatarImages',
    filename: (req, file, cb) => {
      // remove unnecessary spaces from file name and
      // append uuid key to the file name to prevent file name confilicts
      const filename: string =
        path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
      const extension: string = path.parse(file.originalname).ext;
      cb(null, `${filename}${extension}`);
    },
  }),
};

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

  @Post('avatar/:id')
  @UseInterceptors(FileInterceptor('avatar', storage))
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    console.log(file);

    return this.userService.updateAvatarPath(Number(id), {
      avatarPath: file.filename,
    });
  }

  @Get(':imageUrl')
  getAvatarImage(@Param('imageUrl') imageUrl: string) {
    const filePath = path.join(
      process.cwd(),
      'uploads/avatarImages/',
      imageUrl,
    );
    const file = createReadStream(filePath);

    return new StreamableFile(file);
  }
}
