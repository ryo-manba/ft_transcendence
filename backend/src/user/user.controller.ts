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

// FileInterceptorにわたすオプションを設定。
// destination: ファイルの保存先。フォルダが無い場合には、バックエンドを起動したタイミングでフォルダが生成される
// filename: 保存されるファイルのファイル名を修正するためのロジックを設定できる。何も設定しないと、拡張子もつかないランダムなファイル名が勝手につけられる
const storage = {
  storage: diskStorage({
    destination: process.env.AVATAR_IMAGE_DIR,
    filename: (req, file, cb) => {
      // ファイル名に空白があれば削除して、末尾にuuidを追加したあとに拡張子を付与することで
      // 複数ユーザーからimage.jpgみたいなありがちな名前のファイルがアップロードされた場合
      // にもファイルが上書き保存されないようにしている
      const filename: string =
        path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
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
  getLoginUser(@Req() req: Request): Omit<User, 'hashedPassword'> {
    // custom.d.ts で型変換してる
    return req.user;
  }

  @Get(':id')
  getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Omit<User, 'hashedPassword'> | null> {
    return this.userService.findOne(id);
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
  @UseInterceptors(
    FileInterceptor(
      'avatar', // ここの'avatar'はフロントエンドでformData.appendに渡した第一引数のnameと対応
      storage,
    ),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ): Promise<Omit<User, 'hashedPassword'>> {
    return this.userService.updateAvatar(Number(id), {
      avatarPath: file.filename,
    });
  }

  // uniqueSuffixは実際には使わないが、Settingの画面でアバターを更新した際にコンポーネント
  // が更新されるようにするために追加している
  @Get('avatar/:id/:uniqueSuffix')
  getAvatarImage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile | undefined> {
    return this.userService.getAvatarImage(id);
  }

  @Patch('avatar/:id/:avatarPath')
  deleteAvatar(
    @Param('id') id: string,
    @Param('avatarPath') avatarPath: string,
  ): Promise<Omit<User, 'hashedPassword'>> {
    return this.userService.deleteAvatar(Number(id), avatarPath);
  }
}
