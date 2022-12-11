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
        oauthid: dto.oauthid,
      },
    });

    if (!user) {
      // 初めてOAuth認証した時はユーザー登録する
      let sameUsername = await this.prisma.user.findUnique({
        where: { name: dto.oauthid },
      });
      let username = '';
      if (sameUsername) {
        // usernameが使われてたら、一致しないものを生成する
        while (sameUsername) {
          username =
            dto.oauthid + '_' + Math.floor(Math.random() * 100000).toString();
          sameUsername = await this.prisma.user.findUnique({
            where: { name: username },
          });
        }
      } else {
        username = dto.oauthid;
      }
      //パスワードは
      const password = Math.random().toString(36).slice(-16);
      const hashed = await bcrypt.hash(password, 12);
      try {
        // DBへ新規追加
        await this.prisma.user.create({
          data: {
            oauthid: dto.oauthid,
            name: username,
            hashedPassword: hashed,
            avatarPath: dto.imagepath,
          },
        });
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          // Prismaが新規作成時に発行するエラー。
          if (error.code === 'P2002') {
            throw new ForbiddenException('username is already taken');
          }
        }
        throw error;
      }
      user = await this.prisma.user.findUnique({
        where: {
          oauthid: dto.oauthid,
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
    try {
      if (Number.isNaN(userId)) throw new Error('UserId is invalid');
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      const secret = speakeasy.generateSecret();
      const url = speakeasy.otpauthURL({
        secret: secret.base32,
        label: user.name,
        issuer: 'ft_transcendence',
      });
      const qr_code = qrcode.toDataURL(url);

      return qr_code;
    } catch (error) {
      throw error;
    }
  }

  async send2FACode(userId: number, dto: SecretCodeDto): Promise<string> {
    console.log(dto);
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      console.log(user.has2FA);
      const valid = speakeasy.totp.verify({
        secret: 'user.twoFASecret', // TODO: DBからもらった値を使わないと！
        token: dto.code,
      });
      if (!valid) {
        throw new Error('hoge');
      }

      const user_db = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          has2FA: true,
          // twoFASecret: user_db.twoFASecret, あとでDBに追加しないと
        },
      });
    } catch (error) {
      throw error;
    }

    return 'ok';
  }

  public async has2fa(userId: number): Promise<string> {
    try {
      const user_db = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      return 'user_db.has2FA';
      // return { enabled: user_db.has2FA };
    } catch (error) {
      console.log(error);
      throw error;
    }

    // return { enabled: false };
  }

  async validate2FA(data: SecretCodeDto): Promise<string> {
    try {
      const user_db = await this.prisma.user.findUnique({
        where: {
          id: Number(data.userId),
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }

    const valid = speakeasy.totp.verify({
      secret: 'user.twoFASecret', // TODO: DBからもらった値を使わないと！
      token: data.code,
    });
    if (!valid) {
      throw new Error('hoge');
    }

    return 'loginと同じくユーザー情報を返したい';
  }

  async disable2FA(data: SecretCodeDto): Promise<string> {
    try {
      const user_db = await this.prisma.user.findUnique({
        where: {
          id: Number(data.userId),
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }

    try {
      const user_db = await this.prisma.user.update({
        where: {
          id: Number(data.userId),
        },
        data: {
          has2FA: false,
          // twoFASecret: '', あとでDBに追加しないと
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }

    // return { disabled: true };
    return 'disabled: true';
  }
}
