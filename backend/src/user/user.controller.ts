import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserService } from './user.service';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';
import { UpdateNameDto } from './dto/update-name.dto';
import { User, UserStatus } from '@prisma/client';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePointDto } from './dto/update-point.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

// front側へ返す必要のない情報を取り除く
type ExcludeProperties = 'hashedPassword' | 'secret2FA';
type LoginUser = Omit<User, ExcludeProperties>;

// FileInterceptorにわたすオプションを設定。
// destination: ファイルの保存先。フォルダが無い場合には、バックエンドを起動したタイミングでフォルダが生成される
// filename: 保存されるファイルのファイル名を修正するためのロジックを設定できる。何も設定しないと、拡張子もつかないランダムなファイル名が勝手につけられる
const storage = {
  storage: diskStorage({
    destination: process.env.AVATAR_IMAGE_DIR,
    filename: (req, file, cb) => {
      // ファイル名は拡張子のみ保持して、ファイル名自体はuuidに置換
      const filename: string = uuidv4();
      const extension: string = path.parse(file.originalname).ext;
      // cbはコールバックの頭文字っぽい。第一引数はエラー、第二引数はファイル名を設定
      cb(null, `${filename}${extension}`);
    },
  }),
};

@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getLoginUser(@Req() req: Request): LoginUser {
    // custom.d.ts で型変換してる
    return req.user;
  }

  @Get('status')
  async getStatus(
    @Req() req: Request,
    @Query('id', ParseIntPipe) id: number,
  ): Promise<UserStatus | undefined> {
    return await this.userService.getStatus(id);
  }

  @Get('ranking')
  async getRanking(
    @Req() req: Request,
    @Query('id', ParseIntPipe) id: number,
  ): Promise<number> {
    return await this.userService.getRanking(id);
  }

  @Patch('update-status')
  updateStatus(@Body() dto: UpdateStatusDto): Promise<LoginUser> {
    return this.userService.updateStatus(dto);
  }

  @Get(':id')
  getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LoginUser | null> {
    return this.userService.findOne(id);
  }

  @Patch('update-point')
  updatePoint(@Body() dto: UpdatePointDto): Promise<LoginUser> {
    return this.userService.updatePoint(dto);
  }

  @Patch('update-name')
  updateName(@Body() dto: UpdateNameDto): Promise<LoginUser> {
    return this.userService.updateName(dto);
  }

  @Post('avatar/:id')
  @UseInterceptors(
    FileInterceptor(
      'avatar', // ここの'avatar'はフロントエンドでformData.appendに渡した第一引数のnameと対応
      storage,
    ),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LoginUser> {
    const dto: UpdateAvatarDto = {
      userId: id,
      avatarPath: file.filename,
    };

    return this.userService.updateAvatar(dto);
  }

  // uniqueSuffixは実際には使わないが、Settingの画面でアバターを更新した際にコンポーネント
  // が更新されるようにするために追加している
  @Get('avatar/:id/:uniqueSuffix')
  getAvatarImage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile | undefined> {
    return this.userService.getAvatarImage(id);
  }

  @Patch('delete-avatar')
  deleteAvatar(@Body() dto: DeleteAvatarDto): Promise<LoginUser> {
    return this.userService.deleteAvatar(dto);
  }
}
