import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
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
const storage = (destinationPath: string) => ({
  storage: diskStorage({
    destination: destinationPath,
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
});

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

  // storageの部分は、本当は下記のような形で.envからパスを引っ張ってきたいのだが、thisの使い方をちゃんと理解しきれていないせいで
  // うまく実装できていないです。これ、どうやったらいいか、どなたかわかれば教えてほしいです。
  // storage(this.config.get<string>('AVATAR_IMAGE_DIR')),
  @Post('avatar/:id')
  @UseInterceptors(
    FileInterceptor(
      'avatar', // ここの'avatar'はフロントエンドでformData.appendに渡した第一引数のnameと対応
      storage('./uploads/avatarImages'),
    ),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.userService.updateAvatar(Number(id), {
      avatarPath: file.filename,
    });
  }

  @Get(':imageUrl')
  getAvatarImage(@Param('imageUrl') imageUrl: string) {
    return this.userService.getAvatarImage(imageUrl);
  }

  @Patch('avatar/:id/:avatarPath')
  deleteAvatar(
    @Param('id') id: string,
    @Param('avatarPath') avatarPath: string,
  ) {
    return this.userService.deleteAvatar(Number(id), avatarPath);
  }
}
