import {
  Injectable,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, OauthDto } from './dto/auth.dto';
import { SecretCodeDto } from './dto/twofactorauth.dto';
import { Msg, Jwt } from './interfaces/auth.interface';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async singUp(dto: AuthDto): Promise<Msg> {
    // 2の12乗回の演算が必要、という意味の12
    const hashed = await bcrypt.hash(dto.password, 12);
    try {
      // DBへ新規追加
      await this.prisma.user.create({
        data: {
          name: dto.username,
          hashedPassword: hashed,
        },
      });

      return {
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // Prismaが新規作成時に発行するエラー。
        if (error.code === 'P2002') {
          throw new ForbiddenException('username is already taken');
        }
      }
      throw error;
    }
  }

  async login(dto: AuthDto): Promise<Jwt> {
    const user = await this.prisma.user.findUnique({
      where: {
        name: dto.username,
      },
    });
    if (!user) throw new ForbiddenException('username or password incorrect');
    const isValid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!isValid)
      throw new ForbiddenException('username or password incorrect');

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        status: 'ONLINE',
      },
    });

    return this.generateJwt(user.id, user.name);
  }

  async logout(dto: LogoutDto) {
    await this.prisma.user.update({
      where: {
        id: dto.id,
      },
      data: {
        status: 'OFFLINE',
      },
    });
  }

  async generateJwt(userId: number, username: string): Promise<Jwt> {
    const payload = {
      sub: userId,
      username,
    };
    const secret = this.config.get<string>('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      secret: secret,
    });

    return {
      accessToken: token,
    };
  }

  async oauthlogin(dto: OauthDto): Promise<Jwt> {
    let user = await this.prisma.user.findUnique({
      where: {
        oAuthId: dto.oAuthId,
      },
    });

    if (!user) {
      // 初めてOAuth認証した時はユーザー登録する
      const sameUsername = await this.prisma.user.findUnique({
        where: { name: dto.oAuthId },
      });
      let username = '';
      if (sameUsername) {
        // usernameが使われてたら、一致しないものを生成する
        const uniqueSuffix =
          String(Date.now()) + '-' + String(Math.round(Math.random() * 1e9));
        username = dto.oAuthId + '_' + uniqueSuffix;
      } else {
        username = dto.oAuthId;
      }
      try {
        // DBへ新規追加
        await this.prisma.user.create({
          data: {
            oAuthId: dto.oAuthId,
            name: username,
            avatarPath: dto.imagePath,
          },
        });
      } catch (error) {
        throw error;
      }
      user = await this.prisma.user.findUnique({
        where: {
          oAuthId: dto.oAuthId,
        },
      });
      if (!user) throw new ForbiddenException('username or password incorrect');
    }
    // if (user.has2FA) {
    //   UserManager.instance.twoFAlist.push(new TwoFAUser(user.id));

    //   return user.toResponseUser(false, true);
    // }

    return this.generateJwt(user.id, user.name);
  }

  async generateQrCode(userId: number): Promise<string> {
    if (Number.isNaN(userId)) throw new Error('UserId is invalid');
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    try {
      const secret = speakeasy.generateSecret();
      const url = speakeasy.otpauthURL({
        secret: secret.base32,
        label: user.name,
        issuer: 'ft_transcendence',
      });
      const qr_code = qrcode.toDataURL(url);
      //取得したSecretをDBに保存。まだこのユーザーは2FA機能オン状態ではない。
      const user_db = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          secret2FA: secret.base32,
        },
      });

      return qr_code;
    } catch (error) {
      throw error;
    }
  }

  async send2FACode(userId: number, dto: SecretCodeDto): Promise<string> {
    console.log(dto);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    console.log(user.has2FA);
    const valid = speakeasy.totp.verify({
      secret: user.secret2FA,
      token: dto.code,
    });
    if (!valid) {
      throw new Error('hoge');
    }

    try {
      //2FAの登録が完了したら、このユーザーは2FA機能をオンにする
      const user_db = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          has2FA: true,
        },
      });
    } catch (error) {
      throw error;
    }

    return 'ok';
  }

  public async has2FA(userId: number): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      // TODO: 戻り値がstringで良いか、frontendの実装時に再検討予定
      if (user.has2FA) {
        return 'enabled: true';
      } else {
        return 'enabled: false';
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async validate2FA(data: SecretCodeDto): Promise<Jwt> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: Number(data.userId),
      },
    });
    const valid = speakeasy.totp.verify({
      secret: user.secret2FA,
      token: data.code,
    });
    if (!valid) {
      throw new Error('Invalid Speakeasy verify.');
    }

    return this.generateJwt(user.id, user.name);
  }

  async disable2FA(data: SecretCodeDto): Promise<string> {
    try {
      const user_db = await this.prisma.user.update({
        where: {
          id: Number(data.userId),
        },
        data: {
          has2FA: false,
          secret2FA: '',
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }

    // TODO: 戻り値がstringで良いか、frontendの実装時に再検討予定
    return 'disabled: true';
  }
}
